"use client";

import { Download, FileText, List } from "lucide-react";
import { brochurePage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  BrochurePage4Data,
  BrochurePage4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const defaultBrochures: BrochurePage4Item[] = [
  {
    id: "b1",
    title: "Company Profile",
    description:
      "Know more about our company background, mission, vision and core values.",
    image: "/categories/realestate/template4/unsplash-4822b7e0.jpg",
    pages: 12,
    size: "2.4 MB",
  },
  {
    id: "b2",
    title: "Our Services",
    description: "Explore our wide range of real estate services and expertise.",
    image: "/categories/realestate/template4/unsplash-5cdde8b0.jpg",
    pages: 16,
    size: "3.1 MB",
  },
  {
    id: "b3",
    title: "Residential Properties",
    description: "Handpicked selection of premium residential properties.",
    image: "/categories/realestate/template4/unsplash-b901d65c.jpg",
    pages: 20,
    size: "4.5 MB",
  },
  {
    id: "b4",
    title: "Commercial Properties",
    description: "Discover prime commercial spaces for your business growth.",
    image: "/categories/realestate/template4/unsplash-df00f7ba.jpg",
    pages: 18,
    size: "3.8 MB",
  },
  {
    id: "b5",
    title: "Luxury Collection",
    description: "Exclusive luxury properties for a sophisticated lifestyle.",
    image: "/categories/realestate/template4/unsplash-3f53554c.jpg",
    pages: 24,
    size: "5.2 MB",
  },
  {
    id: "b6",
    title: "Investment Guide",
    description: "Smart real estate investment tips and market insights.",
    image: "/categories/realestate/template4/unsplash-f630c348.jpg",
    pages: 14,
    size: "2.8 MB",
  },
];

export default function RealEstateBrochurePage4({ data = {} }: SectionProps) {
  const authored = brochurePage4Content.RealEstateBrochurePage4;
  const content: BrochurePage4Data = {
    ...authored,
    ...(data as BrochurePage4Data),
  };
  const brochures = content.brochures?.length
    ? content.brochures
    : (authored.brochures ?? defaultBrochures);

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="brochure"
      data-editor-fields="accentColor pretitle title description formatLabel downloadLabel brochures"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gray-300" />
            <h3
              className="text-sm font-bold tracking-wider text-[var(--accent)] uppercase"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "BROCHURE LIBRARY"}
            </h3>
            <div className="h-px w-12 bg-gray-300" />
          </div>
          <h2
            className="mb-6 text-4xl font-extrabold tracking-tight text-secondary md:text-5xl"
            data-editor-field="title"
          >
            {content.title ?? "Explore. Download. Discover More."}
          </h2>
          <p
            className="mx-auto max-w-2xl text-[16px] leading-relaxed text-gray-500"
            data-editor-field="description"
          >
            {content.description ??
              "Get in-depth insights about our company, services and properties. Choose a brochure below to download."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {brochures.map((brochure) => (
            <article
              key={brochure.id}
              className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-lg"
            >
              <div className="mb-5 h-48 w-full shrink-0 sm:h-56">
                <img
                  src={brochure.image}
                  alt={brochure.title}
                  className="h-full w-full rounded-lg object-cover"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>

              <div className="flex flex-grow flex-col">
                <div className="mb-5 text-center">
                  <h3
                    className="text-[20px] leading-tight font-bold text-secondary"
                    data-editor-field="title"
                  >
                    {brochure.title}
                  </h3>
                </div>

                <div className="mt-auto">
                  <div className="mb-6 flex items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-2 text-[14px] font-medium text-gray-700">
                      <FileText className="h-4 w-4 text-[var(--accent)]" />
                      <span data-editor-field="formatLabel">
                        {content.formatLabel ?? "PDF Format"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-medium text-gray-700">
                      <List className="h-4 w-4 text-[var(--accent)]" />
                      <span data-editor-field="pages">{brochure.pages} Pages</span>
                    </div>
                  </div>

                  <a
                    href={brochure.file || "/dummy.pdf"}
                    download
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent)] py-3 text-[13px] font-bold tracking-wide text-[var(--accent)] uppercase transition-colors hover:bg-[var(--accent)] hover:text-white"
                    data-editor-field="downloadLabel"
                  >
                    <Download className="h-4 w-4" />
                    {content.downloadLabel ?? "DOWNLOAD PDF"}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
