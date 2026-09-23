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
    <div className="relative aspect-[0.72] overflow-hidden rounded-md bg-slate-100">
      <Image src={item.image} alt={item.alt ?? item.title ?? ""} data-editor-media data-editor-media-type="image" data-editor-media-src={item.image} fill className="object-cover" />
    </div>
  );
}

export default function GalleryOne({ data = {} }: SectionProps) {
  const items = getItems(data);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titleFormatKey = "gallery:title";
  const descriptionFormatKey = "gallery:description";
  const scrollGallery = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-white px-5 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            {data.title && <h2 className="text-2xl font-bold text-slate-950" data-editor-inline-format-key={titleFormatKey}><InlineRichText value={data.title} formatKey={titleFormatKey} /></h2>}
            {data.desc && <p className="mt-1 text-sm text-slate-500" data-editor-inline-format-key={descriptionFormatKey}><InlineRichText value={data.desc} formatKey={descriptionFormatKey} /></p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
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
        <div
          ref={scrollerRef}
          data-export-gallery-scroller
          className="mt-5 flex snap-x gap-8 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <article
              key={`${item.image}-${index}`}
              className="min-w-[min(260px,82vw)] snap-start sm:min-w-[320px] lg:min-w-[calc(25%-1.5rem)]"
            >
              <div className="relative">
                <GalleryImage item={item} />
              </div>
              {item.title && <h3 className="mt-5 text-lg font-bold text-slate-950" data-editor-inline-format-key={`gallery:item:${index}:title`}><InlineRichText value={item.title} formatKey={`gallery:item:${index}:title`} /></h3>}
              {item.alt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600" data-editor-inline-format-key={`gallery:item:${index}:description`}><InlineRichText value={item.alt} formatKey={`gallery:item:${index}:description`} /></p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
