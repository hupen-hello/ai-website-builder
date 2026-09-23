"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getBlock,
  resolveSectionBlocks,
  type ButtonBlock,
  type CardBlock,
} from "../types/section";
import { SectionProps } from "./../../../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import EditorRemoteImage from "../../EditorRemoteImage";
import { useEditorContentPaused } from "../../context/PreviewContext";

export default function BannerThree({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const carousel = getBlock(resolvedBlocks, "carousel", "banner-slider");
  const slides = useMemo(
    () =>
      (carousel?.items.filter(
        (item): item is CardBlock => item.type === "card",
      ) ?? []).filter((slide) => slide.image),
    [carousel],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const isEditorContentPaused = useEditorContentPaused();
  const bannerHeight = data.bannerHeight ?? 70;
  const safeActiveIndex = slides.length ? activeIndex % slides.length : 0;

  useEffect(() => {
    if (slides.length <= 1 || isEditorContentPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isEditorContentPaused, slides.length]);

  const goToPreviousSlide = () => {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setActiveIndex((index) => (index + 1) % slides.length);
  };

  if (!slides.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: `${bannerHeight}dvh` }}
      data-export-banner-slider
    >
      {slides.map((slide, index) => {
        const isActive = index === safeActiveIndex;
        const slideButton = slide.blocks?.find(
          (block): block is ButtonBlock => block.type === "button",
        );
        return (
          <div
            key={slide.id}
            data-export-banner-slide
            data-active={isActive ? "true" : "false"}
            aria-hidden={isActive ? "false" : "true"}
            className={`absolute inset-0 transition-opacity duration-500 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <EditorRemoteImage
              src={slide.image!}
              alt={slide.alt ?? slide.title ?? ""}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={slide.image}
              fill
              priority={index === 0}
              sizes="100vw"
              unoptimized={slide.image?.startsWith("data:")}
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/50" />

            <div className="relative z-10 flex h-full items-center px-5 py-12 sm:px-6 md:px-12">
              <div className="max-w-2xl space-y-4 text-white">
                {slide.title && (
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                    {slide.title}
                  </h1>
                )}
                {slide.desc && (
                  <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-base md:text-lg">
                    {slide.desc}
                  </p>
                )}
                {slideButton && (
                  <BlockRenderer
                    block={slideButton}
                    className="theme-btn inline-flex rounded-md px-5 py-2.5 text-sm font-semibold transition"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPreviousSlide}
            className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white sm:left-4 sm:h-10 sm:w-10"
            aria-label="Previous banner slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={goToNextSlide}
            className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white sm:right-4 sm:h-10 sm:w-10"
            aria-label="Next banner slide"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                data-export-banner-dot
                className={`h-2 rounded-full transition-all ${
                  index === safeActiveIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Show banner slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
