"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, MapPin } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadcrumbNav1 from "../breadcrumb/RealEstateBreadcrumbNav1";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateProjectDetail1({ data = {} }: SectionProps) {
  const title = getString(data.title, "Project details");
  const image = getString(data.image);
  const status = getString(data.status, getString(data.statusText));
  const description = getString(
    data.body,
    getString(data.description, getString(data.desc)),
  );
  const pub = (href: string) => publishedHrefFromData(href, data);
  const homeHref = pub(
    typeof data.homeHref === "string" && data.homeHref.trim()
      ? data.homeHref
      : "/",
  );
  const projectsHref = pub(
    typeof data.projectsHref === "string" && data.projectsHref.trim()
      ? data.projectsHref
      : "/projects",
  );
  const ctaHref = pub(getString(data.ctaHref, "/contact"));

  return (
    <main className="border-t border-[#141414]/10 bg-white text-[#141414]">
      <section
        data-editor-section-label="Project Overview"
        data-editor-fields="homeLabel projectsLabel title desc description body image alt category status statusText location ctaLabel ctaHref backLabel"
        className="px-5 py-10 md:px-8 md:py-14 lg:px-10 lg:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <RealEstateBreadcrumbNav1
            items={[
              {
                label: getString(data.homeLabel, "Home"),
                href: homeHref,
              },
              {
                label: getString(data.projectsLabel, "Projects"),
                href: projectsHref,
              },
              { label: title },
            ]}
          />

          <div className="mt-10 grid items-center gap-10 rounded-[1.5rem] border border-[#141414]/10 bg-[#f8f6f1] p-6 md:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:p-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {status && (
                  <span className="rounded-full bg-[#141414] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    {status}
                  </span>
                )}
                {typeof data.category === "string" && data.category && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#a4472f]">
                    <Building2 size={14} /> {data.category}
                  </p>
                )}
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                {title}
              </h1>
              {typeof data.location === "string" && data.location && (
                <p className="mt-5 flex items-center gap-2 text-sm text-[#141414]/55">
                  <MapPin size={16} /> {data.location}
                </p>
              )}
              {description && (
                <p className="mt-7 text-base leading-8 text-[#141414]/65 md:text-lg">
                  {description}
                </p>
              )}

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-6 text-sm font-semibold text-white transition hover:bg-[#a4472f]"
                >
                  {getString(data.ctaLabel, "Enquire about this project")}
                  <ArrowRight size={15} aria-hidden />
                </Link>
                <Link
                  href={projectsHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#141414]/20 px-6 text-sm font-semibold transition hover:border-[#141414]"
                >
                  <ArrowLeft size={15} aria-hidden />
                  {getString(data.backLabel, "All projects")}
                </Link>
              </div>
            </div>

            {image && (
              <div className="relative aspect-[4/3] min-h-[20rem] overflow-hidden rounded-[1.25rem] bg-[#eee9df] lg:min-h-[32rem]">
                <Image
                  src={image}
                  alt={getString(data.alt, title)}
                  fill
                  priority
                  unoptimized={bypassImageOptimization(image)}
                  sizes="(max-width: 1024px) 100vw, 55vw"
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
