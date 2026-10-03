"use client";

import { useEffect, useState } from "react";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type GalleryItem = {
  id?: string;
  title?: string;
  category?: string;
  desc?: string;
  description?: string;
  image?: string;
};

const IMG = "/categories/realestate/template5";

const defaultItems: GalleryItem[] = [
  {
    id: "p1",
    title: "Luxury Skyline Apartment",
    category: "Residential",
    desc: "A modern 4-bedroom apartment featuring panoramic city views and premium finishes.",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "p2",
    title: "Corporate HQ Renovation",
    category: "Commercial",
    desc: "Complete interior fit-out for a multi-level corporate headquarters.",
    image: `${IMG}/office_reno.png`,
  },
  {
    id: "p3",
    title: "Green Valley Villa",
    category: "Residential",
    desc: "An eco-friendly, sustainable villa with solar integration and smart home features.",
    image: `${IMG}/outdoors_reno.png`,
  },
  {
    id: "p4",
    title: "Downtown Retail Center",
    category: "Commercial",
    desc: "A vibrant retail space designed for maximum foot traffic and visibility.",
    image: `${IMG}/bathroom_reno.png`,
  },
  {
    id: "p5",
    title: "Sunset Beach Resort",
    category: "Hospitality",
    desc: "Luxury resort atmosphere with refined interiors and outdoor living.",
    image: `${IMG}/about_1_1.png`,
  },
  {
    id: "p6",
    title: "Modern Loft Renovation",
    category: "Residential",
    desc: "Conversion of an industrial warehouse into high-end residential lofts.",
    image: `${IMG}/about_1_2.png`,
  },
];

export default function RealEstateGalleryPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(data.pretitle || data.subtitle || "OUR WORK");
  const title = String(data.title || "Explore Our Recent Projects");
  const description = String(
    data.description ||
      data.desc ||
      "Discover how we bring bold ideas to life with precision, creativity, and uncompromising quality.",
  );
  const fullscreenAlt = String(
    data.fullscreenAlt || "Fullscreen Gallery",
  );
  const previousLabel = String(data.previousLabel || "Previous");
  const nextLabel = String(data.nextLabel || "Next");
  const closeLabel = String(data.closeLabel || "Close");

  const items = (
    Array.isArray(data.portfolio) && data.portfolio.length
      ? data.portfolio
      : Array.isArray(data.items) && data.items.length
        ? data.items
        : defaultItems
  ) as GalleryItem[];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
      if (event.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === null ? prev : prev > 0 ? prev - 1 : items.length - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === null ? prev : prev < items.length - 1 ? prev + 1 : 0,
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, items.length]);

  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <section
      className="bg-white py-[60px] max-md:py-5"
      style={getAccentStyle(accent)}
      data-editor-section-label="gallery"
      data-editor-fields="accentColor pretitle title description portfolio fullscreenAlt"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:overflow-x-hidden max-md:px-5">
        <div className="mb-10 text-center">
          <div
            className="mb-4 font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mb-6 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          <p
            className="mx-auto max-w-[700px] text-[1.05rem] leading-[1.6] text-[#666]"
            data-editor-field="description"
          >
            {description}
          </p>
        </div>

        <div
          className="grid grid-cols-3 gap-6 max-md:grid-cols-2 max-md:gap-3"
          data-box-layout-grid="grid"
          data-editor-field="portfolio"
          data-editor-no-inline
        >
          {items.map((item, index) => {
            const image = String(item.image || `${IMG}/kitchen_reno.png`);
            const itemTitle = String(item.title || `Project ${index + 1}`);
            return (
              <button
                key={String(item.id || `${itemTitle}-${index}`)}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className="group relative h-[350px] overflow-hidden rounded-xl border-0 bg-transparent p-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-md:h-[200px]"
              >
                <img
                  src={image}
                  alt={itemTitle}
                  className="pointer-events-none h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-5"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={fullscreenAlt}
        >
          <button
            type="button"
            className="absolute top-5 right-8 border-0 bg-transparent text-[2.5rem] font-bold leading-none text-white"
            onClick={() => setSelectedIndex(null)}
            aria-label={closeLabel}
          >
            ×
          </button>

          <button
            type="button"
            className="absolute top-1/2 left-5 flex h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/20 text-[2rem] text-white"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedIndex((prev) =>
                prev === null
                  ? prev
                  : prev > 0
                    ? prev - 1
                    : items.length - 1,
              );
            }}
            aria-label={previousLabel}
          >
            ‹
          </button>

          <img
            src={String(selected.image || `${IMG}/kitchen_reno.png`)}
            alt={fullscreenAlt}
            className="max-h-[90%] max-w-[90%] rounded object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <button
            type="button"
            className="absolute top-1/2 right-5 flex h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/20 text-[2rem] text-white"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedIndex((prev) =>
                prev === null
                  ? prev
                  : prev < items.length - 1
                    ? prev + 1
                    : 0,
              );
            }}
            aria-label={nextLabel}
          >
            ›
          </button>
        </div>
      ) : null}
    </section>
  );
}
