import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import type { SectionProps } from "../../../types/section";
import { resolvePublishedPageHref } from "../../../lib/sectionScroll";

type AwardItem = {
  year: string;
  title: string;
  org: string;
  image: string;
  alt: string;
};

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getAwards = (value: unknown): AwardItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = getString(item.title);
    const image = getString(item.image);
    if (!title || !image) return [];

    return [{
      year: getString(item.year),
      title,
      org: getString(item.org, getString(item.organization)),
      image,
      alt: getString(item.alt, `${title} award badge`),
    }];
  });
};

function TitleWithAccent({ title }: { title: string }) {
  const match = title.match(/^(.*?\bacross\s+)(.+)$/i);
  if (!match) return <>{title}</>;

  return (
    <>
      {match[1]}
      <span className="text-[#c44536]">{match[2]}</span>
    </>
  );
}

export default function RealEstateAwards1({ data = {} }: SectionProps) {
  const awards = getAwards(data.awardItems);
  const siteBase =
    typeof data.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const button =
    data.button && typeof data.button === "object"
      ? (data.button as Record<string, unknown>)
      : null;

  if (!awards.length) return null;

  return (
    <section id="awards" className="bg-[#faf8f4] px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {data.pretitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c44536]">
              {getString(data.pretitle)}
            </p>
          )}
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#141414] md:text-[2rem]">
            <TitleWithAccent
              title={getString(
                data.title,
                "Recognition earned across Delhi NCR.",
              )}
            />
          </h2>
          {data.desc && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#141414]/60 md:text-base">
              {getString(data.desc)}
            </p>
          )}
        </div>

        <div data-box-layout-grid="grid" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {awards.map((award, index) => (
            <article
              key={`${award.year}-${award.title}-${index}`}
              className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-[#141414]/10 bg-white px-4 py-6 text-center transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(20,20,20,0.06)]"
            >
              <div className="relative h-16 w-16">
                <Image
                  src={award.image}
                  alt={award.alt}
                  fill
                  sizes="64px"
                  unoptimized={
                    award.image.startsWith("http") ||
                    award.image.toLowerCase().endsWith(".svg")
                  }
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={award.image}
                  className="object-contain"
                />
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c44536]">
                {award.year}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-[#141414]">
                {award.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#141414]/45">
                {award.org}
              </p>
            </article>
          ))}
        </div>

        {button &&
          typeof button.label === "string" &&
          typeof button.href === "string" && (
            <div className="mt-10 flex justify-center">
              <Link
                href={resolvePublishedPageHref(button.href, siteBase || undefined)}
                className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c44536]"
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
