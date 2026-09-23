"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { GalleryItemData, SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

const getItems = (data: SectionProps["data"]) =>
  (data?.galleryItems ?? []).slice(0, 6);

function GalleryImage({ item }: { item: GalleryItemData }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
      <Image src={item.image} alt={item.alt ?? item.title ?? ""} data-editor-media data-editor-media-type="image" data-editor-media-src={item.image} fill className="object-cover" />
    </div>
  );
}

export default function GalleryFour({ data = {} }: SectionProps) {
  const items = getItems(data);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollGallery = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          {data.pretitle && <p className="text-sm font-bold uppercase tracking-[0.18em] theme-accent" data-editor-inline-format-key="gallery-four:pretitle"><InlineRichText value={data.pretitle} formatKey="gallery-four:pretitle" /></p>}
          {data.title && <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl" data-editor-inline-format-key="gallery-four:title"><InlineRichText value={data.title} formatKey="gallery-four:title" /></h2>}
          {data.desc && <p className="mt-4 text-slate-600" data-editor-inline-format-key="gallery-four:description"><InlineRichText value={data.desc} formatKey="gallery-four:description" /></p>}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              aria-label="Scroll gallery left"
              onClick={() => scrollGallery(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Scroll gallery right"
              onClick={() => scrollGallery(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div ref={scrollerRef} data-export-gallery-scroller className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, index) => (
            <article key={`${item.image}-${index}`} className="min-w-[min(180px,70vw)] snap-start sm:min-w-[240px]">
              <GalleryImage item={item} />
              {item.title && (
                <h3 className="mt-4 text-lg font-semibold text-slate-950" data-editor-inline-format-key={`gallery-four:${index}:title`}>
                  <InlineRichText value={item.title} formatKey={`gallery-four:${index}:title`} />
                </h3>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
