"use client";

import { industryDetailPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { IndustryDetailPage4Data } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const interpolate = (value: string, name: string) =>
  value.replaceAll("{name}", name);

export default function RealEstateIndustryDetailPage4({
  data = {},
}: SectionProps) {
  const authored = industryDetailPage4Content.RealEstateIndustryDetailPage4;
  const content: IndustryDetailPage4Data = {
    ...authored,
    ...(data as IndustryDetailPage4Data),
  };
  const name = content.name || content.title || "Industry";
  const headingSuffix =
    content.headingSuffix ?? "Real Estate Solutions";
  const body = interpolate(
    content.body ??
      `We provide comprehensive and tailored real estate solutions specifically designed to meet the unique challenges and opportunities in the {name} sector. Whether you are looking for investments, new spaces to grow your business, or premium properties, our experienced team is here to guide you every step of the way.`,
    name,
  );
  const quote = interpolate(
    content.quote ??
      `Our goal is to create long-lasting value and exceptional experiences in the {name} real estate market.`,
    name,
  );

  return (
    <section
      className="bg-white py-16 md:py-24"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="industryDetail"
      data-editor-fields="accentColor image name aboutPretitle headingSuffix description body quote"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          <div className="h-[400px] w-full overflow-hidden rounded-2xl shadow-lg lg:w-1/2">
            <img
              src={content.image ?? ""}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              data-editor-media="image"
              data-editor-media-type="image"
            />
          </div>

          <div className="w-full lg:w-1/2">
            <h3
              className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
              data-editor-field="aboutPretitle"
            >
              {content.aboutPretitle ?? "About the Industry"}
            </h3>
            <h2 className="mb-6 text-3xl leading-tight font-extrabold text-secondary md:text-5xl">
              <span data-editor-field="name">{name}</span>{" "}
              <span data-editor-field="headingSuffix">{headingSuffix}</span>
            </h2>
            <div className="mb-8 h-1 w-16 rounded-full bg-[var(--accent)]" />
            <p
              className="mb-6 text-lg leading-relaxed text-gray-600"
              data-editor-field="description"
            >
              {content.description ?? ""}
            </p>
            <p
              className="mb-8 leading-relaxed text-gray-600"
              data-editor-field="body"
            >
              {body}
            </p>
            <div className="rounded-r-lg border-l-4 border-[var(--accent)] bg-gray-50 p-6">
              <p
                className="font-medium text-secondary italic"
                data-editor-field="quote"
              >
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
