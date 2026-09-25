"use client";

import { Quote } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import type { Vision4Data, Vision4Feature } from "../../../types/realEstatePage4";
import { visionPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import { WebsiteIcon } from "../../../lib/websiteIcons";

export default function RealEstateVision4({ data = {} }: SectionProps) {
  const authored = visionPage4Content.RealEstateVision4;
  const content: Vision4Data = { ...authored, ...(data as Vision4Data) };
  const features: Vision4Feature[] =
    content.features?.length ? content.features : (authored.features ?? []);

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="vision"
      data-editor-fields="accentColor pretitle title description features image imageTitle quote"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-0">
          <div className="w-full lg:w-1/2 lg:border-r lg:border-gray-200 lg:pr-16">
            <p
              className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "Our Vision"}
            </p>
            <h2
              className="mb-6 text-4xl font-bold leading-tight text-secondary md:text-5xl"
              data-editor-field="title"
            >
              {content.title ?? "Building a Better Tomorrow, One Property at a Time."}
            </h2>
            <p
              className="mb-10 text-lg leading-relaxed text-gray-600"
              data-editor-field="description"
            >
              {content.description ?? content.desc ?? ""}
            </p>

            <div className="space-y-8" data-box-layout-grid="grid">
              {features.map((feature, index) => {
                return (
                  <div className="flex gap-4" key={feature.title ?? index}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f7f8] text-[var(--accent)]">
                      <WebsiteIcon name={feature.icon || "Eye"} className="h-5 w-5" />
                    </div>
                    <div>
                      <h4
                        className="mb-1 font-bold text-secondary"
                        data-editor-field="featureTitle"
                      >
                        <span className="text-[var(--accent)]">
                          {feature.accent ?? ""}
                        </span>{" "}
                        {feature.title ?? ""}
                      </h4>
                      <p
                        className="text-sm font-medium leading-relaxed text-gray-500"
                        data-editor-field="featureDescription"
                      >
                        {feature.description ?? feature.desc ?? ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-16 w-full lg:mt-0 lg:w-1/2 lg:pl-16">
            <div className="relative overflow-hidden rounded-xl shadow-xl">
              <img
                src={content.image ?? ""}
                alt={content.imageTitle ?? "Our vision"}
                className="h-[400px] w-full object-cover transition-transform duration-700 hover:scale-105 lg:h-[600px]"
                data-editor-media="image"
                data-editor-media-type="image"
              />
            </div>

            <div className="absolute -bottom-8 -left-4 max-w-[480px] rounded-xl bg-[var(--accent)] p-6 text-white shadow-xl md:-left-8 md:p-8 lg:-left-4">
              <div className="flex items-start gap-4">
                <Quote className="mt-1 h-10 w-10 shrink-0 opacity-90" />
                <p
                  className="text-[15px] font-medium leading-relaxed"
                  data-editor-field="quote"
                >
                  {content.quote ?? ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
