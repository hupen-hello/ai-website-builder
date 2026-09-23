"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import {
  handleManagerCardClick,
  slugFromListingHref,
} from "../../../lib/editorManagerCards";

const ease = [0.22, 1, 0.36, 1] as const;

type HighlightCard = {
  title: string;
  category: string;
  desc: string;
  image: string;
  alt: string;
  href: string;
  slug: string;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const propertyDetailHref = (href: string, title: string, slug?: string, detailBase?: string) => {
  const path = href.split("?")[0].replace(/\/+$/, "").toLowerCase();
  const id = (slug || slugify(title)).trim();
  if (!id) return detailBase || href || "/properties";
  if (
    !href ||
    path === "" ||
    path === "/properties" ||
    path === "/property" ||
    /^\/(properties|property)\/[^/]+$/.test(path)
  ) {
    return detailBase ? `${detailBase}/${id}` : `/properties/${id}`;
  }
  return href;
};

const getHighlightCards = (value: unknown, detailBase?: string): HighlightCard[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const card = item as Record<string, unknown>;
    if (
      typeof card.title !== "string" ||
      typeof card.image !== "string"
    ) {
      return [];
    }

    return [
      {
        title: card.title,
        category:
          typeof card.category === "string" ? card.category : "Property",
        desc: typeof card.desc === "string" ? card.desc : "",
        image: card.image,
        alt: typeof card.alt === "string" ? card.alt : card.title,
        slug:
          typeof card.slug === "string" && card.slug.trim()
            ? card.slug.trim()
            : slugify(card.title),
        href: propertyDetailHref(
          typeof card.href === "string" ? card.href : "",
          card.title,
          typeof card.slug === "string" ? card.slug : undefined,
          detailBase,
        ),
      },
    ];
  });
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateHighlight1({ data = {}, editorMode = false }: SectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const leftBtnRef = useRef<HTMLButtonElement>(null);
  const rightBtnRef = useRef<HTMLButtonElement>(null);
  const detailBase = typeof data.propertyDetailBase === "string" ? data.propertyDetailBase : undefined;
  const cards = getHighlightCards(data.categories, detailBase);
  const pretitle = typeof data.categoriesPretitle === "string" ? data.categoriesPretitle : "Explore properties";
  const title = typeof data.categoriesTitle === "string" ? data.categoriesTitle : "Find the right property for your next move.";
  const desc = typeof data.categoriesDesc === "string" ? data.categoriesDesc : "Browse homes by intent and property type across Delhi NCR.";

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const updateScrollButtons = () => {
      const leftBtn = leftBtnRef.current;
      const rightBtn = rightBtnRef.current;
      if (!leftBtn || !rightBtn) return;
      leftBtn.disabled = scroller.scrollLeft <= 2;
      rightBtn.disabled =
        scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    };

    updateScrollButtons();
    scroller.addEventListener("scroll", updateScrollButtons, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [cards.length]);

  const scrollCards = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.85, 280),
      behavior: "smooth",
    });
  };

  if (!cards.length) return null;

  return (
    <section className="bg-white py-7 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
        <div className="mx-auto mb-9 max-w-2xl text-center md:mb-11">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c44536]">{pretitle}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#141414] md:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#141414]/60 md:text-base">{desc}</p>
        </div>
        <div className="relative">
          <div
            ref={scrollerRef}
            data-box-layout-grid="carousel"
            data-editor-no-inline
            className="grid snap-x snap-mandatory auto-cols-[88%] grid-flow-col gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] sm:auto-cols-[48%] sm:gap-4 lg:auto-cols-[calc((100%_-_2rem)/3)] [&::-webkit-scrollbar]:hidden"
          >
            {cards.map((item, index) => (
              <motion.div
              key={`${item.title}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease }}
              className="h-full snap-start"
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#141414]/8 bg-white transition duration-300 hover:border-[#141414]/15 hover:shadow-[0_12px_28px_rgba(20,20,20,0.06)]"
                onClick={(event) => {
                  handleManagerCardClick(event, editorMode, "Properties", {
                    slug:
                      item.slug ||
                      slugFromListingHref(item.href, "properties") ||
                      slugify(item.title),
                    href: item.href,
                    title: item.title,
                  });
                }}
              >
                <div className="relative aspect-[2/1] overflow-hidden sm:aspect-[16/9]">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 48vw, 33vw"
                    unoptimized={bypassImageOptimization(item.image)}
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={item.image}
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#141414]">
                    {item.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-[#141414] transition group-hover:text-[#c44536]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-[#141414]/55">
                    {item.desc}
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#141414] underline decoration-[#141414]/25 underline-offset-4 transition group-hover:decoration-[#c44536]">
                    Explore
                    <span
                      aria-hidden
                      className="inline-block transition duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>

          <button
            ref={leftBtnRef}
            type="button"
            aria-label="Previous property categories"
            onClick={() => scrollCards(-1)}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:scale-105 hover:bg-[#141414] hover:text-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            ref={rightBtnRef}
            type="button"
            aria-label="Next property categories"
            onClick={() => scrollCards(1)}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#141414] shadow-lg transition hover:scale-105 hover:bg-[#141414] hover:text-white disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
