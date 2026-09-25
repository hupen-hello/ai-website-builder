"use client";

import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { pricingPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { PricingHelpBanner4Data } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

export default function RealEstatePricingHelpBanner4({
  data = {},
}: SectionProps) {
  const authored = pricingPage4Content.RealEstatePricingHelpBanner4;
  const content: PricingHelpBanner4Data = {
    ...authored,
    ...(data as PricingHelpBanner4Data),
  };

  return (
    <div
      className="container mx-auto mb-20 max-w-5xl px-4"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="pricingHelp"
      data-editor-fields="accentColor title description buttonText buttonLink"
    >
      <div className="flex flex-col items-center justify-between gap-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:p-8">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-[var(--accent)] md:mx-0">
            <Headphones className="h-8 w-8" />
          </div>
          <div>
            <h3
              className="mb-1 text-xl font-bold text-secondary"
              data-editor-field="title"
            >
              {content.title ?? "Need Help Choosing the Right Plan?"}
            </h3>
            <p
              className="text-sm text-gray-500"
              data-editor-field="description"
            >
              {content.description ?? ""}
            </p>
          </div>
        </div>

        <Link
          href={content.buttonLink ?? "/template4/contact"}
          className="flex flex-shrink-0 items-center bg-[var(--accent)] px-8 py-3 font-bold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
        >
          <span data-editor-field="buttonText">
            {content.buttonText ?? "CONTACT US"}
          </span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
