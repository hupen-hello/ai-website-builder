"use client";

import { awardPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  AwardPage4Data,
  AwardPage4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const YearDots = ({ reverse = false }: { reverse?: boolean }) => {
  const dotClasses = reverse
    ? [
        "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_80%,transparent)]",
      ]
    : [
        "bg-[color-mix(in_srgb,var(--accent)_80%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
        "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
      ];

  return (
    <span className="flex gap-1" aria-hidden="true">
      {dotClasses.map((className) => (
        <span
          key={className}
          className={`h-1 w-1 rounded-full ${className}`}
        />
      ))}
    </span>
  );
};

const HeadingDots = ({ reverse = false }: { reverse?: boolean }) => (
  <span className="flex gap-1" aria-hidden="true">
    {(reverse
      ? ["bg-[var(--accent)]", "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]", "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]"]
      : ["bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]", "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]", "bg-[var(--accent)]"]
    ).map((className) => (
      <span
        key={className}
        className={`h-1 w-1 rounded-full ${className}`}
      />
    ))}
  </span>
);

export default function RealEstateAwardPage4({ data = {} }: SectionProps) {
  const authored = awardPage4Content.RealEstateAwardPage4;
  const content: AwardPage4Data = {
    ...authored,
    ...(data as AwardPage4Data),
  };
  const awards: AwardPage4Item[] = content.awards?.length
    ? content.awards
    : (authored.awards ?? []);

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="awards"
      data-editor-fields="accentColor pretitle title description awards"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <HeadingDots />
            <h3
              className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "Our Honors"}
            </h3>
            <HeadingDots reverse />
          </div>

          <h2
            className="mb-6 text-3xl font-bold tracking-tight text-secondary md:text-5xl"
            data-editor-field="title"
          >
            {content.title ?? "Recognized For Excellence"}
          </h2>
          <p
            className="text-lg text-gray-600"
            data-editor-field="description"
          >
            {content.description ?? ""}
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {awards.map((award) => (
            <article
              key={award.id}
              className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative mb-6 flex h-40 w-32 items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-110">
                <img
                  src={award.image}
                  alt={award.title}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>

              <div className="flex w-full flex-grow flex-col">
                <h4
                  className="mb-3 text-[17px] font-bold leading-snug text-[#101820]"
                  data-editor-field="title"
                >
                  {award.title}
                </h4>
                <p
                  className="mb-6 text-[14px] leading-relaxed text-gray-500"
                  data-editor-field="description"
                >
                  {award.description}
                </p>

                <div className="mt-auto flex items-center justify-center gap-3 border-t border-gray-50 pt-4">
                  <YearDots />
                  <span
                    className="text-sm font-bold tracking-wider text-[var(--accent)]"
                    data-editor-field="year"
                  >
                    {award.year}
                  </span>
                  <YearDots reverse />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
