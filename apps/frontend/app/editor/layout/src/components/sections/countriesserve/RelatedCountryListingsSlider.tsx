"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export type RelatedCountryListingCard = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  image?: string;
  href: string;
};

type RelatedCountryListingsSliderProps = {
  countryLabel: string;
  items: RelatedCountryListingCard[];
  /** Defaults to "More listings from {countryLabel}". */
  heading?: string;
  /** Defaults to "View listing". */
  ctaLabel?: string;
  /** Use plain <a> for hash routes in the editor canvas. */
  useAnchor?: boolean;
};

export default function RelatedCountryListingsSlider({
  countryLabel,
  items,
  heading,
  ctaLabel = "View listing",
  useAnchor = false,
}: RelatedCountryListingsSliderProps) {
  const slides = useMemo(
    () => items.filter((item) => item.title.trim() && item.href.trim()),
    [items],
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const titleText = heading?.trim() || `More listings from ${countryLabel}`;

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 640) setCardsPerView(1);
      else if (width < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxStart = Math.max(0, slides.length - cardsPerView);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, cardsPerView, countryLabel, titleText]);

  useEffect(() => {
    if (paused || slides.length <= cardsPerView) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxStart ? 0 : current + 1));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length, cardsPerView, maxStart]);

  if (!slides.length) return null;

  const start = Math.min(Math.max(0, index), maxStart);
  const canSlide = slides.length > cardsPerView;
  const gapPx = 20;
  const cardBasis = `calc((100% - ${(cardsPerView - 1) * gapPx}px) / ${cardsPerView})`;
  const step = `calc((100% - ${(cardsPerView - 1) * gapPx}px) / ${cardsPerView} + ${gapPx}px)`;

  const CardLink = ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) =>
    useAnchor ? (
      <a href={href} className={className}>
        {children}
      </a>
    ) : (
      <Link href={href} className={className}>
        {children}
      </Link>
    );

  return (
    <section
      className="border-t border-slate-100 bg-slate-50 px-5 py-14 sm:px-8 sm:py-16 lg:px-12"
      data-export-related-slider
      data-cards-per-view={String(cardsPerView)}
      data-cards-per-view-desktop="3"
      data-cards-per-view-mobile="1"
      data-gap={String(gapPx)}
      data-item-count={String(slides.length)}
      data-autoplay="1"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {countryLabel}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {titleText}
            </h2>
          </div>
          {canSlide ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous related items"
                onClick={() =>
                  setIndex((current) =>
                    current <= 0 ? maxStart : current - 1,
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                type="button"
                aria-label="Next related items"
                onClick={() =>
                  setIndex((current) =>
                    current >= maxStart ? 0 : current + 1,
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          ) : null}
        </div>

        <div
          className="relative mt-8 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out will-change-transform"
            data-export-related-track
            style={{
              gap: gapPx,
              transform: `translateX(calc(-1 * ${start} * ${step}))`,
            }}
          >
            {slides.map((listing) => {
              const image = (listing.image || "").trim() || "/bg1.jpg";
              return (
                <div
                  key={listing.id || listing.href}
                  className="shrink-0"
                  style={{ flex: `0 0 ${cardBasis}`, width: cardBasis }}
                >
                  <CardLink
                    href={listing.href}
                    className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {listing.category || countryLabel}
                      </p>
                      <h3 className="mt-1.5 text-base font-bold text-slate-950 transition group-hover:underline">
                        {listing.title}
                      </h3>
                      {listing.desc ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {listing.desc}
                        </p>
                      ) : null}
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        {ctaLabel} <ArrowRight size={15} />
                      </span>
                    </div>
                  </CardLink>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
