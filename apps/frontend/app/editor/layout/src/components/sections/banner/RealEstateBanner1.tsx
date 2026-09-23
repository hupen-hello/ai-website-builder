"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  resolveBannerSlideButtons,
  type SectionProps,
} from "../../../types/section";
import { resolvePublishedPageHref } from "../../../lib/sectionScroll";

const ease = [0.22, 1, 0.36, 1] as const;

const wordContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const wordReveal = {
  hidden: { y: "110%" },
  show: {
    y: "0%",
    transition: { duration: 0.75, ease },
  },
};

function RevealWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");

  return (
    <motion.h1
      className={className}
      variants={wordContainer}
      initial="hidden"
      animate="show"
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden align-bottom pb-[0.08em]"
        >
          <motion.span className="inline-block" variants={wordReveal}>
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateBanner1({
  data = {},
}: SectionProps) {
  const siteBase =
    typeof data.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const portfolioDetailBase =
    typeof data.portfolioDetailBase === "string" ? data.portfolioDetailBase : "";
  const resolveHref = (href: string) =>
    resolvePublishedPageHref(href, siteBase || undefined, {
      detailBase: portfolioDetailBase || undefined,
    });
  const slides = useMemo(
    () =>
      data.bannerSlides?.length
        ? data.bannerSlides.slice(0, 3)
        : [
          {
            image: data.backgroundImage ?? "",
            alt: data.backgroundImageTitle ?? data.title ?? "",
            pretitle: data.pretitle,
            title: data.title ?? "",
            desc: data.desc,
            button: data.buttons?.[0],
          },
        ],
    [
      data.backgroundImage,
      data.backgroundImageTitle,
      data.bannerSlides,
      data.buttons,
      data.desc,
      data.pretitle,
      data.title,
    ],
  );
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide(0);
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      className="relative isolate h-[calc(100svh-4rem)] w-full overflow-hidden bg-[#141414] md:h-[calc(100svh-14rem)]"
      style={{height: `${data.bannerHeight ?? 70}vh`,}}
      data-export-banner-slider
    >
      {slides.map((slide, index) => {
        const isActive = index === activeSlide;
        const slideImage = slide?.image || data.backgroundImage || "";
        const slidePretitle = slide?.pretitle || data.pretitle || "";
        const slideTitle = slide?.title || data.title || "";
        const slideDescription = slide?.desc || data.desc;
        const slideButtons = resolveBannerSlideButtons(slide, data.buttons);
        const titleClassName =
          "mt-3 text-[1.6rem] font-semibold leading-[1.12] tracking-[-0.02em] text-white min-[380px]:text-[1.85rem] sm:mt-4 sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4rem]";
        return (
          <div
            key={`${slideTitle}-${index}`}
            data-export-banner-slide
            data-active={isActive ? "true" : "false"}
            aria-hidden={isActive ? "false" : "true"}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {slideImage ? (
              <Image
                src={slideImage}
                alt={slide?.alt || data.backgroundImageTitle || slideTitle}
                fill
                priority={index === 0}
                sizes="100vw"
                unoptimized={bypassImageOptimization(slideImage)}
                data-editor-media
                data-editor-media-type="image"
                data-editor-media-src={slideImage}
                className="object-cover object-[55%_center] sm:object-center"
              />
            ) : null}
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/25" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/50 to-transparent" />
            <div className="relative z-2 flex h-full w-full flex-col justify-center overflow-hidden px-5 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16">
              <div className="mx-auto w-full max-w-7xl">
                <div className="max-w-2xl">
                  {slidePretitle ? (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80 sm:text-[11px]">
                      {slidePretitle}
                    </p>
                  ) : null}
                  {slideTitle ? (
                    isActive ? (
                      <RevealWords
                        key={slideTitle}
                        text={slideTitle}
                        className={titleClassName}
                      />
                    ) : (
                      <h1 className={titleClassName}>{slideTitle}</h1>
                    )
                  ) : null}
                  {slideDescription ? (
                    <p className="mt-3 max-w-70 text-[13px] leading-relaxed text-white/85 sm:mt-4 sm:max-w-lg sm:text-sm md:text-base">
                      {slideDescription}
                    </p>
                  ) : null}
                  {slideButtons.length ? (
                    <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
                      {slideButtons.map((button, buttonIndex) => {
                        const isPrimary =
                          (button.variant ?? (buttonIndex === 0 ? "primary" : "secondary")) ===
                          "primary";
                        return (
                        <Link
                          key={`${button.label}-${button.href}-${buttonIndex}`}
                          href={resolveHref(button.href)}
                          target={button.openInNewTab ? "_blank" : undefined}
                          rel={button.openInNewTab ? "noopener noreferrer" : undefined}
                          className={
                            isPrimary
                              ? "inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#141414] transition hover:bg-white/90 sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
                              : "inline-flex w-full items-center justify-center rounded-full border border-white/80 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10 sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
                          }
                        >
                          {button.label}
                        </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActiveSlide(
                (prev) => (prev - 1 + slides.length) % slides.length
              )
            }
            className="absolute left-2 top-[35%] z-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-3 sm:top-[42%] sm:h-9 sm:w-9 md:left-6 md:h-11 md:w-11"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-2 top-[35%] z-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-3 sm:top-[42%] sm:h-9 sm:w-9 md:right-6 md:h-11 md:w-11"
            aria-label="Next slide"
          >
            <FaChevronRight className="text-sm" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-5 flex -translate-x-1/2 gap-2 sm:bottom-8">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                data-export-banner-dot
                className={`h-2 rounded-full transition ${activeSlide === index ? "w-8 bg-white" : "w-2 bg-white/45"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

    </section>
  );
}
