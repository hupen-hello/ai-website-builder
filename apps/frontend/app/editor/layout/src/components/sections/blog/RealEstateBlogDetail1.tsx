"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadcrumbNav1 from "../breadcrumb/RealEstateBreadcrumbNav1";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateBlogDetail1({ data = {} }: SectionProps) {
  const title = getString(data.title, "Living spaces that feel like home");
  const image = getString(data.image);
  const excerpt = getString(data.body, getString(data.excerpt, getString(data.desc)));
  const date = getString(data.date);
  const primaryButtonLabel = getString(data.primaryButtonLabel, "Talk to an advisor");
  const primaryButtonHref = publishedHrefFromData(
    getString(data.primaryButtonHref, "/contact"),
    data,
  );
  const secondaryButtonLabel = getString(data.secondaryButtonLabel, "All articles");
  const secondaryButtonHref = publishedHrefFromData(
    getString(data.secondaryButtonHref, "/blog"),
    data,
  );
  const homeHref = publishedHrefFromData("/", data);
  const blogIndexHref = publishedHrefFromData("/blog", data);

  return (
    <main className="border-t border-[#141414]/10 bg-white text-[#141414]">
      <section data-editor-section-label="Blog Article" className="px-5 py-10 md:px-8 md:py-14 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[112rem]">
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
                  typeof data.blogLabel === "string"
                    ? data.blogLabel
                    : "Blog",
                href: blogIndexHref,
              },
              { label: title },
            ]}
          />

          <div className="mt-10 grid items-center gap-10 lg:mt-12 lg:grid-cols-[1fr_1.08fr] lg:gap-16 xl:gap-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c44536]">{getString(data.pretitle, "Blog")}</p>
              <h1 className="mt-6 max-w-3xl whitespace-nowrap text-[clamp(0.75rem,2.2vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.045em]">{title}</h1>

              {date && (
                <p className="mt-8 flex items-center gap-3 text-base text-[#141414]/55">
                  <CalendarDays size={19} className="text-[#c44536]" aria-hidden />
                  {date}
                </p>
              )}

              {excerpt && <p className="mt-10 max-w-3xl text-lg leading-8 text-[#141414]/75 md:text-xl md:leading-10">{excerpt}</p>}

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={primaryButtonHref} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#141414] px-8 text-base font-semibold text-white transition hover:bg-[#a4472f]">
                  {primaryButtonLabel} <ArrowRight size={17} aria-hidden />
                </Link>
                <Link href={secondaryButtonHref} className="inline-flex min-h-14 items-center gap-3 rounded-full border border-[#141414]/20 px-8 text-base font-semibold transition hover:border-[#141414]">
                  <ArrowLeft size={17} aria-hidden /> {secondaryButtonLabel}
                </Link>
              </div>
            </div>

            {image && (
              <div className="relative aspect-[16/10] min-h-[20rem] overflow-hidden rounded-[1.35rem] bg-[#eee9df] lg:min-h-[34rem]">
                <Image
                  src={image}
                  alt={getString(data.alt, title)}
                  fill
                  priority
                  unoptimized={bypassImageOptimization(image)}
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover"
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={image}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
