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
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
      <Image src={item.image} alt={item.alt ?? item.title ?? ""} data-editor-media data-editor-media-type="image" data-editor-media-src={item.image} fill className="object-cover" />
    </div>
  );
}

export default function GalleryThree({ data = {} }: SectionProps) {
  const items = getItems(data);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollGallery = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-[#f8fafc] px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">
        {data.title && <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl" data-editor-inline-format-key="gallery-three:title"><InlineRichText value={data.title} formatKey="gallery-three:title" /></h2>}
        <div className="mt-6 flex justify-center gap-2">
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
        <div ref={scrollerRef} data-export-gallery-scroller className="mt-8 flex snap-x gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.slice(0, 6).map((item, index) => (
            <article key={`${item.image}-${index}`} className="min-w-[min(280px,82vw)] snap-start sm:min-w-[340px]">
              <GalleryImage item={item} />
              {item.title && (
                <h3 className="mt-4 text-lg font-semibold text-slate-950" data-editor-inline-format-key={`gallery-three:${index}:title`}>
                  <InlineRichText value={item.title} formatKey={`gallery-three:${index}:title`} />
                </h3>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
