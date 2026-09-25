"use client";

import { useState } from "react";
import {
  Building2,
  Crown,
  Grid,
  Home,
  LayoutTemplate,
  PartyPopper,
  X,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import type {
  GalleryPage4Data,
  GalleryPage4Item,
} from "../../../types/realEstatePage4";
import { galleryPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";

type GalleryCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const categories: GalleryCategory[] = [
  { id: "All", label: "All", icon: Grid },
  { id: "Residential", label: "Residential", icon: Home },
  { id: "Commercial", label: "Commercial", icon: Building2 },
  { id: "Luxury Homes", label: "Luxury Homes", icon: Crown },
  { id: "Interiors", label: "Interiors", icon: LayoutTemplate },
  { id: "Events", label: "Events", icon: PartyPopper },
];

export default function RealEstateGalleryPage4({ data = {} }: SectionProps) {
  const authored = galleryPage4Content.RealEstateGalleryPage4;
  const content: GalleryPage4Data = {
    ...authored,
    ...(data as GalleryPage4Data),
  };
  const items: GalleryPage4Item[] = content.items?.length
    ? content.items
    : (authored.items ?? []);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState<GalleryPage4Item | null>(
    null,
  );

  const filteredItems =
    activeFilter === "All"
      ? items
      : items.filter((item) => item.category === activeFilter);

  return (
    <>
      <section
        className="bg-white py-8 md:py-12"
        style={getAccentStyle(content.accentColor)}
        data-editor-section-label="gallery"
        data-editor-fields="accentColor pretitle title description items"
      >
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <p
              className="mb-2 font-semibold uppercase tracking-wider text-[var(--accent)]"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "Our Gallery"}
            </p>
            <h2
              className="mb-4 text-3xl font-bold text-secondary md:text-4xl"
              data-editor-field="title"
            >
              {content.title ?? "Explore Our Spaces & Projects"}
            </h2>
            <p
              className="mx-auto max-w-2xl text-gray-500"
              data-editor-field="description"
            >
              {content.description ?? ""}
            </p>
          </div>

          <div className="mb-16 flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeFilter === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveFilter(category.id)}
                  className={`flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-all duration-300 ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-lg shadow-teal-900/20"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            data-box-layout-grid="grid"
          >
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-gray-100 md:aspect-[4/3]"
                onClick={() => setSelectedImage(item)}
                aria-label={`Open ${item.title ?? item.category ?? "gallery image"}`}
              >
                <img
                  src={item.image}
                  alt={item.title ?? item.category ?? "Gallery image"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ZoomIn className="h-10 w-10 translate-y-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-10 text-center text-gray-500 md:py-14">
              No items found for this category.
            </div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title ?? "Gallery preview"}
        >
          <button
            type="button"
            className="absolute right-4 top-4 p-2 text-white/70 transition-colors hover:text-white md:right-6 md:top-6"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Close gallery preview"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage.image}
            alt={selectedImage.title ?? "Gallery preview"}
            className="max-h-[90vh] max-w-full rounded-md object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
