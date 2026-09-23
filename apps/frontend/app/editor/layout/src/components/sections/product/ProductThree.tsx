"use client";

import Image from "next/image";
import { ProductCardData, SectionProps } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import { useOptionalPreview } from "../../context/PreviewContext";
import { findProductPageName, scrollProductPageToTop } from "./productNavigation";

const fallbackCards: ProductCardData[] = [
  {
    title: "Virtual walkthrough first",
    category: "Walkthrough",
    desc: "A guided tour of your site before the AI writes a single line of code.",
    image: "/bg1.jpg",
    imageTitle: "Website builder laptop",
  },
  {
    title: "AI-powered page builder",
    category: "AI Builder",
    desc: "Describe what you need. The AI generates it in seconds, not weeks.",
    image: "/bg2.jpg",
    imageTitle: "AI page builder desk setup",
  },
  {
    title: "Fast-loading pages",
    category: "Performance",
    desc: "Clean code means your site loads fast on any device, anywhere.",
    image: "/blackbay.png",
    imageTitle: "Fast loading mobile website",
  },
  {
    title: "Built for New Delhi",
    category: "Local SEO",
    desc: "Local SEO and regional optimization built in. Your site shows up where it matters.",
    image: "/shaye.png",
    imageTitle: "New Delhi street",
  },
  {
    title: "One person, full focus",
    category: "Custom Build",
    desc: "No account managers, no committees. Just Muneeb building your site from scratch.",
    image: "/stylam.png",
    imageTitle: "Developer working at desk",
  },
  {
    title: "Simple pricing, no surprises",
    category: "Pricing",
    desc: "What you see is what you pay. No hidden fees or upsells for basic features.",
    image: "/prod2.jpg",
    imageTitle: "Simple pricing card",
  },
];

export default function ProductThree({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const cardBlocks = getBlocksByType(resolvedBlocks, "card");
  const productCards = cardBlocks;
  void fallbackCards;
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button");
  const preview = useOptionalPreview();
  const openProductPage = (pageName?: string) => {
    if (!preview || !pageName?.trim()) return;

    const existingPage = findProductPageName(preview.pageLinks, pageName);
    if (!existingPage) return;

    preview.setCurrentPage(existingPage);
    scrollProductPageToTop();
  };

  return (
    <section className="w-full bg-[#0d1f2a] px-4 py-12 text-white md:px-8 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-8 text-sm font-bold uppercase tracking-wide">
              {getTextBlockByRole(resolvedBlocks, "pretitle")?.content}
            </p>

            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "heading")}
              className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            />
          </div>

          <div className="lg:pt-12">
            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "paragraph")}
              className="max-w-2xl text-base font-medium leading-relaxed sm:text-xl md:text-2xl"
            />

            <div className="mt-10 flex flex-wrap gap-5">
              {buttonBlocks.map((button, index) => (
                <BlockRenderer
                  key={button.id}
                  block={button}
                    className={`rounded-xl px-5 py-3 text-sm font-bold transition sm:rounded-2xl sm:px-8 sm:py-5 sm:text-base ${
                    index === 0
                      ? "theme-btn"
                      : "bg-blue-200 text-black hover:bg-blue-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-x-9 gap-y-10 sm:grid-cols-2 md:mt-24 md:gap-y-14 lg:grid-cols-3">
          {productCards.map((card) => (
            <article
              key={card.id}
              role={card.link ? "link" : undefined}
              tabIndex={card.link ? 0 : undefined}
              onClick={() => openProductPage(card.link)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProductPage(card.link);
                }
              }}
              className={card.link ? "cursor-pointer" : undefined}
            >
              <div className="relative h-[280px] overflow-hidden rounded-2xl md:h-[320px]">
                {card.image && (
                  <Image
                    src={card.image}
                    alt={card.alt ?? card.title ?? ""}
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={card.image}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-white sm:mt-7 sm:text-3xl">
                {card.title}
              </h3>

              <p className="mt-4 text-base font-medium leading-relaxed text-white">
                {card.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
