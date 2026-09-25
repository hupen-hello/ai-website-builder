"use client";

import type { ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Cross,
  Factory,
  GraduationCap,
  Hotel,
  Landmark,
  ShoppingCart,
} from "lucide-react";
import { industriesPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  IndustriesPage4Data,
  IndustryPage4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Building2,
  Briefcase,
  ShoppingCart,
  Factory,
  Cross,
  GraduationCap,
  Hotel,
  Landmark,
};

export default function RealEstateIndustriesPage4({
  data = {},
}: SectionProps) {
  const authored = industriesPage4Content.RealEstateIndustriesPage4;
  const content: IndustriesPage4Data = {
    ...authored,
    ...(data as IndustriesPage4Data),
  };
  const industries: IndustryPage4Item[] = content.industries?.length
    ? content.industries
    : (authored.industries ?? []);
  const learnMoreLabel = content.learnMoreLabel ?? "Learn More";

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="industries"
      data-editor-fields="accentColor pretitle title description learnMoreLabel industries"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h3
            className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
            data-editor-field="pretitle"
          >
            {content.pretitle ?? "Our Industries"}
          </h3>
          <h2
            className="mb-4 text-3xl font-bold text-secondary md:text-4xl"
            data-editor-field="title"
          >
            {content.title ?? "Building Spaces For Every Industry"}
          </h2>
          <p className="text-gray-600" data-editor-field="description">
            {content.description ?? ""}
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {industries.map((industry) => {
            const Icon =
              (industry.icon ? iconMap[industry.icon] : null) || Building2;
            const name = industry.title || industry.name || "";

            return (
              <article
                key={industry.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative mb-8">
                  <div className="h-48 overflow-hidden rounded-t-xl">
                    <img
                      src={industry.image}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      data-editor-media="image"
                      data-editor-media-type="image"
                    />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[var(--accent)] text-white shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-8 text-center">
                  <h4
                    className="mb-3 text-lg font-bold text-secondary"
                    data-editor-field="name"
                  >
                    {name}
                  </h4>
                  <div className="mx-auto mb-4 h-0.5 w-8 bg-[var(--accent)]" />
                  <p
                    className="mb-6 flex-1 text-sm leading-relaxed text-gray-500"
                    data-editor-field="description"
                  >
                    {industry.description}
                  </p>
                  <Link
                    href={`/template4/industries/${industry.id}`}
                    className="inline-flex items-center justify-center gap-1 text-sm font-bold text-[var(--accent)] transition-colors hover:opacity-80"
                  >
                    <span data-editor-field="learnMoreLabel">
                      {learnMoreLabel}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
