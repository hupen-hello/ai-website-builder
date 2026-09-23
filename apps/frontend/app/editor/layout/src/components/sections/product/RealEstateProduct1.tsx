"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { ProductSlideData, SectionProps } from "./../../../types/section";
import { getBlocksByType, resolveSectionBlocks } from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import { useOptionalPreview } from "../../context/PreviewContext";
import { findProductPageName, scrollProductPageToTop } from "./productNavigation";

const fallbackSlides: ProductSlideData[] = [
  {
    image: "/55.jpg",
    alt: "Laptop product one",
    productTitle: "Builder Nor Showcase",
    productSubtitle: "Create the art of below",
    productInfoTitle: "Inspiration Need",
    productInfoDesc:
      "We assist travelers worldwide with ETA visas and arrivals cards. Get accurate guidance, faster processing, and reliable support before your journey begins.",
    productFeatures: [
      { label: "Small suitcase", price: "+$100" },
      { label: "Cold wind color", price: "+$50" },
      { label: "360° Spin wheels", price: "+$95" },
      { label: "Fixes handle", price: "0" },
    ],
    productTotalPrice: "$1245",
    productShippingText: "Free shipping available",
    button: {
      label: "Know more",
      href: "#",
      variant: "primary",
    },
  },
];

export default function RealEstateProduct1({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const cardBlocks = getBlocksByType(resolvedBlocks, "card");
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = cardBlocks;
  void fallbackSlides;
  const activeSlide = slides[activeIndex] ?? slides[0];
  const slideButton = activeSlide?.blocks?.find((block) => block.type === "button");
  const preview = useOptionalPreview();
  const openProductPage = () => {
    if (!preview || !activeSlide?.link?.trim()) return;

    const existingPage = findProductPageName(
      preview.pageLinks,
      activeSlide.link,
    );
    if (!existingPage) return;

    preview.setCurrentPage(existingPage);
    scrollProductPageToTop();
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  if (!activeSlide) return null;

  return (
    <section
      className="w-full bg-white"
      data-export-product-slider
      data-slides={JSON.stringify(
        slides.map((slide) => ({
          image: slide.image || "",
          alt: slide.alt || slide.title || "",
          title: slide.title || "",
          category: slide.category || "",
          desc: slide.desc || "",
        })),
      )}
    >
      <div className="mx-auto max-w-7xl bg-radial from-white via-blue-50 to-transparent px-5 py-12 md:px-10 md:py-20">
        <div
          role={activeSlide.link ? "link" : undefined}
          tabIndex={activeSlide.link ? 0 : undefined}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button,a")) return;
            openProductPage();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openProductPage();
            }
          }}
          className={`grid items-center gap-10 lg:grid-cols-[1fr_1.4fr_1fr] ${activeSlide.link ? "cursor-pointer" : ""}`}
        >
          <div>
            <h1
              className="text-3xl font-bold leading-tight text-black sm:text-4xl md:text-5xl"
              data-export-product-title
            >
              {activeSlide.title}
            </h1>

            <p className="mt-3 text-sm text-black" data-export-product-category>
              {activeSlide.category}
            </p>

            <div className="mt-6 w-full max-w-[260px] rounded-sm bg-white p-4 shadow md:mt-8 md:max-w-[210px]">
              {(data.productFeatures ?? []).map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between border-b border-dashed border-gray-300 py-2 text-xs text-black"
                >
                  <span>{item.label}</span>
                  <span>{item.price}</span>
                </div>
              ))}

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-black">
                    Total Price:
                  </p>
                  <p className="text-[9px] text-gray-500">
                    {data.productShippingText}
                  </p>
                </div>
                <p className="text-xl text-black">
                  {data.productTotalPrice}
                </p>
              </div>
            </div>

            {slideButton && (
              <BlockRenderer
                block={slideButton}
                className="mt-4 inline-block rounded bg-blue-600 px-6 py-2 text-xs font-bold text-white"
              />
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="relative h-[240px] w-full max-w-[420px] sm:h-[300px] md:h-[360px]">
              <div className="absolute bottom-2 left-1/2 h-12 w-[80%] -translate-x-1/2 rounded-full bg-slate-500/90 blur-2xl" />

              {activeSlide.image && (
                <Image
                  src={activeSlide.image}
                  alt={activeSlide.alt ?? activeSlide.title ?? ""}
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={activeSlide.image}
                  data-export-product-image
                  fill
                  className="object-contain drop-shadow-[0_28px_24px_rgba(15,23,42,0.18)]"
                  priority
                />
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                aria-label="Previous product slide"
                onClick={prevImage}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow transition hover:bg-gray-100 sm:h-12 sm:w-12"
              >
                <ArrowLeft size={22} />
              </button>

              <button
                type="button"
                aria-label="Next product slide"
                onClick={nextImage}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow transition hover:bg-gray-100 sm:h-12 sm:w-12"
              >
                <ArrowRight size={22} />
              </button>
            </div>
          </div>

          <div>
            <h2
              className="text-2xl font-bold text-black sm:text-3xl"
              data-export-product-title
            >
              {activeSlide.title}
            </h2>

            <p
              className="mt-3 max-w-sm text-sm leading-relaxed text-black lg:max-w-xs lg:text-xs"
              data-export-product-desc
            >
              {activeSlide.desc}
            </p>

            <div className="mt-8 rounded-sm bg-white p-5 shadow">
              {(data.productFeatures ?? []).map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between border-b border-dashed border-gray-300 py-3 text-sm text-black"
                >
                  <span>{item.label}</span>
                  <span>{item.price}</span>
                </div>
              ))}

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-black">Total Price:</p>
                  <p className="text-[10px] text-gray-500">
                    {data.productShippingText}
                  </p>
                </div>

                {slideButton && (
                  <BlockRenderer
                    block={slideButton}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold text-white"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
