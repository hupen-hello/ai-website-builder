"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SectionProps, TestimonialItemData } from "../../../types/section";

const fallbackItems: TestimonialItemData[] = [
  {
    name: "Aarav Mehta",
    role: "Founder, Studio North",
    quote: "The site made our work easier to understand and brought in better leads within the first week.",
    image: "/bg1.jpg",
    rating: "5.0",
  },
  {
    name: "Neha Kapoor",
    role: "Marketing Lead",
    quote: "Clean sections, fast pages, and the editor keeps the content simple for our whole team.",
    image: "/bg2.jpg",
    rating: "4.9",
  },
];

const getItems = (data: SectionProps["data"]) =>
  data?.testimonialItems ?? [];
void fallbackItems;
const getRating = (rating?: string) =>
  Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

export default function RealEstateTestimonial2({ data = {} }: SectionProps) {
  const items = getItems(data);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollClients = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 420,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const interval = window.setInterval(() => scrollClients(1), 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
            {data.pretitle}
          </p>
          {data.title && <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{data.title}</h2>}
          {data.desc && <p className="mt-4 text-slate-300">{data.desc}</p>}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              aria-label="Scroll clients left"
              onClick={() => scrollClients(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Scroll clients right"
              onClick={() => scrollClients(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div ref={scrollerRef} data-box-layout-grid="carousel" data-box-layout-gap="medium" className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-4">
          {items.map((item, itemIndex) => (
            <article key={`${item.name}-${itemIndex}`} className="min-w-[min(320px,82vw)] snap-start rounded-2xl bg-white p-5 text-slate-950 sm:p-8 md:min-w-[460px]">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    fill={index < getRating(item.rating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="mt-6 text-xl font-semibold leading-8 sm:text-2xl sm:leading-10">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-100">
                  {item.image && <Image src={item.image} alt={item.name} data-editor-media data-editor-media-type="image" data-editor-media-src={item.image} fill className="object-cover" />}
                </div>
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
