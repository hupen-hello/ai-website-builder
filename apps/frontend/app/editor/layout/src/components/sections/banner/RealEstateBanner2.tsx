import Image from "next/image";
import Link from "next/link";

import type { SectionProps } from "../../../types/section";
import { resolvePublishedPageHref } from "../../../lib/sectionScroll";

export default function RealEstateBanner2({ data = {} }: SectionProps) {
  const siteBase =
    typeof data.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const portfolioDetailBase =
    typeof data.portfolioDetailBase === "string" ? data.portfolioDetailBase : "";
  const resolveHref = (href: string) =>
    resolvePublishedPageHref(href, siteBase || undefined, {
      detailBase: portfolioDetailBase || undefined,
    });
  const background =
    data.bannerBackgroundMode === "gradient"
      ? `linear-gradient(135deg, ${data.bannerBackgroundColor ?? "#142019"}, ${data.bannerGradientColor ?? "#142019"})`
      : data.bannerBackgroundMode === "solid"
        ? (data.bannerBackgroundColor ?? "#142019")
        : "#142019";

  return (
    <section
      className="relative flex w-full items-end overflow-hidden"
      style={{ minHeight: `${data.bannerHeight ?? 70}dvh`, background }}
    >
      {data.bannerBackgroundMode === "video" && data.backgroundVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={data.backgroundImage}
          data-editor-media
          data-editor-media-type="video"
          data-editor-media-src={data.backgroundVideo}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={data.backgroundVideo} />
        </video>
      ) : data.backgroundImage ? (
        <Image
          src={data.backgroundImage}
          alt={data.backgroundImageTitle ?? data.title ?? ""}
          data-editor-media
          data-editor-media-type="image"
          data-editor-media-src={data.backgroundImage}
          fill
          priority
          sizes="100vw"
          unoptimized={
            data.backgroundImage.startsWith("data:") ||
            data.backgroundImage.startsWith("http://") ||
            data.backgroundImage.startsWith("https://")
          }
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09110b]/10 via-[#09110b]/35 to-[#09110b]/90" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-8 px-6 pb-10 pt-36 sm:px-10 lg:grid-cols-[1fr_360px] lg:px-14 lg:pb-14">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#e7d5ae]">
            {data.pretitle}
          </p>
          <h1 className="max-w-4xl font-serif text-5xl leading-none text-white sm:text-6xl lg:text-8xl">
            {data.title}
          </h1>
        </div>

        <aside className="border-l border-white/40 bg-white/10 p-6 text-white backdrop-blur-md">
          <p className="mb-6 text-sm leading-6 text-white/75">{data.desc}</p>
          {data.buttons?.length ? (
            <div className="flex flex-wrap gap-3">
              {data.buttons.map((button, index) => (
                <Link
                  key={`${button.label}-${index}`}
                  href={resolveHref(button.href)}
                  className={
                    button.variant === "secondary"
                      ? "inline-flex rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white"
                      : "inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#142019]"
                  }
                >
                  {button.label}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="mt-7 flex gap-6 border-t border-white/20 pt-5 text-xs uppercase tracking-[0.18em] text-white/65">
            <span>Homes</span>
            <span>Land</span>
            <span>Investments</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
