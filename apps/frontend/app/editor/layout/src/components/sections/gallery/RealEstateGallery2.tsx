"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { GalleryItemData, SectionProps } from "../../../types/section";

const getItems = (data: SectionProps["data"]) =>
  (data?.galleryItems ?? []).slice(0, 6);

function GalleryImage({ item }: { item: GalleryItemData }) {
  return (
    <div className="relative h-72 min-w-[min(280px,82vw)] overflow-hidden rounded-xl bg-slate-100 sm:h-80">
      <Image src={item.image} alt={item.alt ?? item.title ?? ""} data-editor-media data-editor-media-type="image" data-editor-media-src={item.image} fill className="object-cover" />
    </div>
  );
}

export default function RealEstateGallery2({ data = {} }: SectionProps) {
  const items = getItems(data);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollGallery = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          {data.title && <h2 className="text-3xl font-semibold sm:text-4xl">{data.title}</h2>}
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Scroll gallery left"
              onClick={() => scrollGallery(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Scroll gallery right"
              onClick={() => scrollGallery(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div ref={scrollerRef} data-box-layout-grid="carousel" className="mt-10 flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, index) => (
            <article key={`${item.image}-${index}`}>
              <GalleryImage item={item} />
              {item.title && (
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {item.title}
                </h3>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
