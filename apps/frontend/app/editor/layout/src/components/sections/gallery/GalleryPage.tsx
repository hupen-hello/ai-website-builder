"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItemData, SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";
import { normalizeGalleryIndexLayout } from "../../../lib/galleryLayouts";
import {
  THEME_ACCENT,
  THEME_PRIMARY_BG,
  THEME_PRIMARY_TEXT,
} from "../../../lib/themeTokens";

const DEFAULT_CATEGORY = "Gallery";

const readGalleryItems = (data: SectionProps["data"]): GalleryItemData[] => {
  const raw = data?.galleryItems ?? [];
  return raw
    .map((item, index) => ({
      ...item,
      id: item.id || `gallery-${index}`,
      category: item.category || DEFAULT_CATEGORY,
      order: typeof item.order === "number" ? item.order : index + 1,
      active: item.active !== false,
    }))
    .filter((item) => item.image && item.active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const PageHeader = ({ data }: { data: SectionProps["data"] }) => (
  <div className="max-w-3xl">
    {data?.pretitle ? (
      <p
        className="text-sm font-semibold uppercase tracking-[0.16em]"
        style={{ color: THEME_ACCENT }}
        data-editor-inline-format-key="gallery-page:pretitle"
      >
        <InlineRichText
          value={data.pretitle}
          formatKey="gallery-page:pretitle"
        />
      </p>
    ) : null}

    <h1
      className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
      data-editor-inline-format-key="gallery-page:title"
    >
      <InlineRichText value={data?.title ?? ""} formatKey="gallery-page:title" />
    </h1>

    {data?.desc ? (
      <p
        className="mt-4 text-base leading-7 text-slate-600 sm:text-lg"
        data-editor-inline-format-key="gallery-page:description"
      >
        <InlineRichText
          value={data.desc}
          formatKey="gallery-page:description"
        />
      </p>
    ) : null}
  </div>
);

const ItemCaption = ({
  item,
  index,
  variant = "overlay",
}: {
  item: GalleryItemData;
  index: number;
  variant?: "overlay" | "below";
}) => {
  const title = item.title ?? "";
  const caption = item.desc || item.alt || "";

  if (!title && !caption) return null;

  if (variant === "below") {
    return (
      <div className="px-1 pt-3">
        {title ? (
          <h2
            className="text-sm font-semibold text-slate-900"
            data-editor-inline-format-key={`gallery-page:${index}:title`}
          >
            <InlineRichText
              value={title}
              formatKey={`gallery-page:${index}:title`}
            />
          </h2>
        ) : null}
        {caption ? (
          <p
            className="mt-1 text-sm text-slate-500"
            data-editor-inline-format-key={`gallery-page:${index}:description`}
          >
            <InlineRichText
              value={caption}
              formatKey={`gallery-page:${index}:description`}
            />
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
      {title ? (
        <h2
          className="text-lg font-semibold"
          data-editor-inline-format-key={`gallery-page:${index}:title`}
        >
          <InlineRichText
            value={title}
            formatKey={`gallery-page:${index}:title`}
          />
        </h2>
      ) : null}
      {caption ? (
        <p
          className="mt-1 line-clamp-2 text-sm text-white/80"
          data-editor-inline-format-key={`gallery-page:${index}:description`}
        >
          <InlineRichText
            value={caption}
            formatKey={`gallery-page:${index}:description`}
          />
        </p>
      ) : null}
    </div>
  );
};

const GalleryImage = ({
  item,
  index,
  className = "relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  item: GalleryItemData;
  index: number;
  className?: string;
  sizes?: string;
}) => (
  <div className={className}>
    <Image
      src={item.image}
      alt={item.alt ?? item.title ?? ""}
      data-editor-media
      data-editor-media-type="image"
      data-editor-media-src={item.image}
      fill
      sizes={sizes}
      className="object-cover transition duration-500 group-hover:scale-105"
    />
  </div>
);

function PlainGallery({ items }: { items: GalleryItemData[] }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <article key={`${item.id}-${index}`} className="group">
          <GalleryImage item={item} index={index} />
          <ItemCaption item={item} index={index} variant="below" />
        </article>
      ))}
    </div>
  );
}

function GridGallery({ items }: { items: GalleryItemData[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item, index) => (
        <article
          key={`${item.id}-${index}`}
          className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
        >
          <GalleryImage
            item={item}
            index={index}
            className="relative h-full w-full"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
          <ItemCaption item={item} index={index} />
        </article>
      ))}
    </div>
  );
}

function SliderGallery({ items }: { items: GalleryItemData[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index];

  if (!current) return null;

  const move = (direction: -1 | 1) => {
    setIndex((value) => (value + direction + items.length) % items.length);
  };

  return (
    <div className="mt-10">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={current.image}
          alt={current.alt ?? current.title ?? ""}
          data-editor-media
          data-editor-media-type="image"
          data-editor-media-src={current.image}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <ItemCaption item={current} index={index} />
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600">
            {index + 1} / {items.length}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item, thumbIndex) => (
              <button
                key={`${item.id}-thumb-${thumbIndex}`}
                type="button"
                onClick={() => setIndex(thumbIndex)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  thumbIndex === index
                    ? "ring-2 ring-offset-1"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={
                  thumbIndex === index
                    ? {
                        borderColor: THEME_PRIMARY_BG,
                        boxShadow: `0 0 0 2px color-mix(in srgb, ${THEME_PRIMARY_BG} 25%, transparent)`,
                      }
                    : undefined
                }
                aria-label={`Show image ${thumbIndex + 1}`}
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabWiseGallery({ items }: { items: GalleryItemData[] }) {
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(items.map((item) => item.category || DEFAULT_CATEGORY)),
    );
    return unique.length ? unique : [DEFAULT_CATEGORY];
  }, [items]);

  const [activeTab, setActiveTab] = useState(categories[0] ?? DEFAULT_CATEGORY);
  const filtered = items.filter(
    (item) => (item.category || DEFAULT_CATEGORY) === activeTab,
  );

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveTab(category)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === category
                ? "text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            style={
              activeTab === category
                ? {
                    backgroundColor: THEME_PRIMARY_BG,
                    color: THEME_PRIMARY_TEXT,
                  }
                : undefined
            }
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {filtered.map((item, index) => (
          <article
            key={`${item.id}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
          >
            <GalleryImage
              item={item}
              index={index}
              className="relative h-full w-full"
            />
            <ItemCaption item={item} index={index} />
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          No images in this category yet.
        </p>
      ) : null}
    </div>
  );
}

function RandomGallery({ items }: { items: GalleryItemData[] }) {
  const spanPattern = (index: number) => {
    if (index % 7 === 0 || index % 7 === 4) return "sm:col-span-2 sm:row-span-2";
    if (index % 5 === 2) return "sm:row-span-2";
    return "";
  };

  return (
    <div className="mt-10 grid auto-rows-[180px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={`${item.id}-${index}`}
          className={`group relative overflow-hidden rounded-lg bg-slate-100 ${spanPattern(index)}`}
        >
          <GalleryImage
            item={item}
            index={index}
            className="relative h-full min-h-[180px] w-full"
          />
          <ItemCaption item={item} index={index} />
        </article>
      ))}
    </div>
  );
}

export default function GalleryPage({ data = {} }: SectionProps) {
  const layout = normalizeGalleryIndexLayout(
    typeof data.layout === "string" ? data.layout : "GalleryPage-1",
  );
  const items = readGalleryItems(data);

  return (
    <section className="bg-white px-5 py-16 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeader data={data} />

        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            Add gallery images from the Gallery manager to show them here.
          </p>
        ) : layout === "GalleryPage-2" ? (
          <SliderGallery items={items} />
        ) : layout === "GalleryPage-3" ? (
          <GridGallery items={items} />
        ) : layout === "GalleryPage-4" ? (
          <TabWiseGallery items={items} />
        ) : layout === "GalleryPage-5" ? (
          <RandomGallery items={items} />
        ) : (
          <PlainGallery items={items} />
        )}
      </div>
    </section>
  );
}
