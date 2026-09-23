"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FaQuoteLeft, FaStar } from "react-icons/fa";
import type {
  SectionProps,
  TestimonialItemData,
} from "../../../types/section";

const getItems = (value: unknown): TestimonialItemData[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is TestimonialItemData =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as TestimonialItemData).name === "string" &&
              typeof (item as TestimonialItemData).quote === "string",
          ),
      )
    : [];

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateTestimonial1({
  data = {},
}: SectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = getItems(data.testimonialItems);

  if (!items.length) return null;

  const goTo = (index: number) => {
    const scroller = scrollerRef.current;
    const card = scroller?.children[index] as HTMLElement | undefined;
    if (!scroller || !card) return;
    scroller.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    setActive(index);
  };

  return (
    <section id="testimonials" className="bg-white py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          {data.pretitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c44536]">
              {String(data.pretitle)}
            </p>
          )}
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#141414] md:text-[2.5rem]">
            {String(data.title || "Trusted by buyers, renters, and homeowners.")}
          </h2>
          {data.desc && (
            <p className="mt-5 text-sm leading-6 text-[#141414]/65 md:text-base">
              {String(data.desc)}
            </p>
          )}
        </div>

        <div
          ref={scrollerRef}
          data-box-layout-grid="carousel"
          className="mt-10 grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[48%] lg:auto-cols-[calc((100%_-_3rem)/4)] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const scroller = event.currentTarget;
            const cards = Array.from(scroller.children) as HTMLElement[];
            if (!cards.length) return;
            const nearest = cards.reduce(
              (best, card, index) =>
                Math.abs(card.offsetLeft - scroller.scrollLeft) <
                Math.abs(cards[best].offsetLeft - scroller.scrollLeft)
                  ? index
                  : best,
              0,
            );
            if (nearest !== active) setActive(nearest);
          }}
        >
          {items.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              className={`flex min-h-56 snap-start flex-col rounded-2xl border p-5 transition ${
                active === index
                  ? "border-[#c44536]/45 bg-[#faf8f4]"
                  : "border-[#141414]/10 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <FaQuoteLeft
                  className="text-lg text-[#c44536]/70"
                  aria-hidden
                />
                {item.rating && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#c44536]">
                    <FaStar className="text-[9px]" aria-hidden />
                    {item.rating}
                  </span>
                )}
              </div>

              <p className="mt-4 flex-1 text-sm leading-6 text-[#141414]/70">
                {item.quote}
              </p>

              <div className="mt-5 flex items-center gap-3 border-t border-[#141414]/10 pt-4">
                {item.image && (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f3efe8]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="40px"
                      unoptimized={bypassImageOptimization(item.image)}
                      data-editor-media
                      data-editor-media-type="image"
                      data-editor-media-src={item.image}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#141414]">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-[#141414]/50">
                    {item.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {items.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={`${item.name}-dot`}
                type="button"
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={active === index ? "true" : undefined}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition ${
                  active === index
                    ? "w-6 bg-[#c44536]"
                    : "w-2 bg-[#141414]/20 hover:bg-[#141414]/35"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
