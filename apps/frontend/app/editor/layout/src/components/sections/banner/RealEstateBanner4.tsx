"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { getBlocksByType, resolveSectionBlocks } from "../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc";

const getPageLabelFromHref = (href: string, fallback: string) => {
  const route = href
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .split(/[?#]/, 1)[0];

  if (!route) return "Home";

  return route
    .split("/")
    .filter(Boolean)
    .pop()!
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase()) || fallback;
};

export default function RealEstateBanner4({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const buttons = getBlocksByType(resolvedBlocks, "button");
  const preview = useOptionalPreview();

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string
  ) => {
    if (!preview) return;

    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bgImage = resolveMediaSrc(
    data.backgroundImage || data.bgImage,
    0,
  );
  const pretitle = data.pretitle || "Luxury Properties";
  const title = data.title || "FIND YOUR <br />DREAM PROPERTY";
  const desc =
    data.desc ||
    "Discover exceptional homes in the most sought-after locations. Let us help you find the perfect place to call home.";
  const primaryButton = buttons[0] || (data.buttons && data.buttons[0]);

  // Support <br /> in title if it's passed as a string
  const renderTitle = () => {
    return { __html: title };
  };

  return (
    <section
      className="relative h-[80vh] min-h-[600px] flex items-center bg-gray-900 overflow-hidden"
      data-editor-section-label="Banner"
      data-editor-fields="pretitle title desc backgroundImage buttons"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 to-transparent" />

      <div className="container mx-auto px-4 relative z-20 max-w-[1400px]">
        <div className="max-w-2xl text-white">
          {pretitle && (
            <p
              className="text-[#0a8296] font-semibold tracking-wider uppercase mb-4"
              data-editor-field="pretitle"
            >
              {pretitle}
            </p>
          )}

          {title && (
            <h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              data-editor-field="title"
              dangerouslySetInnerHTML={renderTitle()}
            />
          )}

          {desc && (
            <p
              className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg"
              data-editor-field="desc"
            >
              {desc}
            </p>
          )}

          {primaryButton && (
            <Link
              href={primaryButton.href || "#"}
              onClick={(event) =>
                handleNavigate(
                  event,
                  primaryButton.href || "#",
                  primaryButton.label || ""
                )
              }
              className="inline-flex items-center justify-center bg-[#0a8296] hover:bg-[#076473] h-12 px-8 text-base font-semibold tracking-wide rounded-md transition-colors text-white"
            >
              {primaryButton.label || "EXPLORE LISTINGS"}{" "}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
