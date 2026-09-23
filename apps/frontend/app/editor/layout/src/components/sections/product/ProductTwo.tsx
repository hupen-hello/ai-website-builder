"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCardData, SectionProps } from "./../../../types/section";
import { generalSansMedium } from "@/app/fonts";
import { getBlocksByType, getTextBlockByRole, resolveSectionBlocks } from "../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { findProductPageName, scrollProductPageToTop } from "./productNavigation";
import InlineRichText from "../../builder/InlineRichText";

const fallbackProducts: ProductCardData[] = [
  {
    title: "Category 1",
    category: "Product 1",
    desc: "It saves disk space and RAM because multiple running programs share the exact same physical file and memory space.",
    image: "/prod2.jpg",
    alt: "Travel ready product",
  },
  {
    title: "Category 2",
    category: "Product 2",
    desc: "It saves disk space and RAM because multiple running programs share the exact same physical file and memory space.",
    image: "/55.jpg",
    alt: "Builder showcase product",
  },
  {
    title: "Category 3",
    category: "Product 3",
    desc: "It saves disk space and RAM because multiple running programs share the exact same physical file and memory space.",
    image: "/blackbay.png",
    alt: "Premium product display",
  },
  {
    title: "Category 4",
    category: "Product 4",
    desc: "This is the fourth card shown when you click the right arrow.",
    image: "/shaye.png",
    alt: "Luxury product display",
  },
  {
    title: "Category 5",
    category: "Product 5",
    desc: "This is the fifth card shown after the fourth card.",
    image: "/stylam.png",
    alt: "Modern product display",
  },
];

export default function ProductTwo({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const cardBlocks = getBlocksByType(resolvedBlocks, "card");
  const [startIndex, setStartIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const products = cardBlocks;
  void fallbackProducts;
  const sectionTitle =
    getTextBlockByRole(resolvedBlocks, "heading")?.content;
  const visibleCards = 3;
  const animationDuration = 420;
  const preview = useOptionalPreview();
  const openProductPage = (pageName?: string) => {
    if (!preview || !pageName?.trim()) return;

    const existingPage = findProductPageName(preview.pageLinks, pageName);
    if (!existingPage) return;

    preview.setCurrentPage(existingPage);
    scrollProductPageToTop();
  };

  useEffect(() => {
    if (!isAnimating) return;

    const timeout = window.setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);

    return () => window.clearTimeout(timeout);
  }, [isAnimating]);

  const startSlideAnimation = (direction: "next" | "prev") => {
    setSlideDirection(direction);
    setAnimationKey((prev) => prev + 1);
    setIsAnimating(true);
  };

  const nextSlide = () => {
    if (isAnimating) return;

    startSlideAnimation("next");
    setStartIndex((prev) =>
      prev + visibleCards >= products.length ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    if (isAnimating) return;

    startSlideAnimation("prev");
    setStartIndex((prev) =>
      prev === 0 ? Math.max(products.length - visibleCards, 0) : prev - 1,
    );
  };

  const shownProducts = products.slice(startIndex, startIndex + visibleCards);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl bg-radial from-white via-blue-50 to-transparent px-5 py-12 md:py-20">
        <h2
          className={`mb-8 text-center text-3xl font-bold text-black underline sm:text-4xl ${generalSansMedium.className}`}
          data-editor-inline-format-key="product-two:section-title"
        >
          <InlineRichText
            value={sectionTitle ?? ""}
            formatKey="product-two:section-title"
          />
        </h2>

        <div
          key={animationKey}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
          style={{
            animation: `${
              slideDirection === "next"
                ? "productTwoSlideNext"
                : "productTwoSlidePrev"
            } ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}
        >
          {shownProducts.map((product, index) => (
            <article
              key={product.id}
              role={product.link ? "link" : undefined}
              tabIndex={product.link ? 0 : undefined}
              onClick={() => openProductPage(product.link)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProductPage(product.link);
                }
              }}
              className={`overflow-hidden rounded-3xl border border-gray-300 bg-white ${product.link ? "cursor-pointer" : ""}`}
              style={{
                animation: `productTwoCardLift ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
                animationDelay: `${index * 55}ms`,
              }}
            >
              <div className="relative h-60 w-full">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.alt ?? product.title ?? ""}
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={product.image}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="px-4 py-3">
                <h3
                  className="text-base font-bold text-black"
                  data-editor-inline-format-key={`product-two:${product.id ?? startIndex + index}:title`}
                >
                  <InlineRichText
                    value={product.title ?? ""}
                    formatKey={`product-two:${product.id ?? startIndex + index}:title`}
                  />
                </h3>
              </div>

              <div className="border-t border-gray-300 px-4 py-4">
                <p
                  className="text-sm leading-relaxed text-black"
                  data-editor-inline-format-key={`product-two:${product.id ?? startIndex + index}:description`}
                >
                  <InlineRichText
                    value={product.desc ?? ""}
                    formatKey={`product-two:${product.id ?? startIndex + index}:description`}
                  />
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={prevSlide}
            disabled={isAnimating}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            disabled={isAnimating}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes productTwoSlideNext {
          from {
            opacity: 0;
            transform: translateX(34px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes productTwoSlidePrev {
          from {
            opacity: 0;
            transform: translateX(-34px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes productTwoCardLift {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
