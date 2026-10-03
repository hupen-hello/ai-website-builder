"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type AwardItem = {
  id?: string;
  year?: string;
  title?: string;
  desc?: string;
  description?: string;
  image?: string;
};

const IMG = "/categories/realestate/template5";

const defaultAwards: AwardItem[] = [
  {
    id: "2024",
    year: "2024",
    title: "Excellence in Architecture Design Award",
    desc: "Honored for outstanding architectural design and innovative solutions.",
    image: `${IMG}/hero_worker.png`,
  },
  {
    id: "2023",
    year: "2023",
    title: "Best Residential Project of the Year",
    desc: "Recognized for delivering the best residential project with quality and creativity.",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "2022",
    year: "2022",
    title: "Customer Satisfaction Excellence Award",
    desc: "Awarded for achieving the highest standards in client satisfaction.",
    image: `${IMG}/bathroom_reno.png`,
  },
  {
    id: "2021",
    year: "2021",
    title: "Innovation in Construction Award",
    desc: "Recognized for using innovative techniques and modern construction practices.",
    image: `${IMG}/office_reno.png`,
  },
  {
    id: "2020",
    year: "2020",
    title: "Top Builder Recognition",
    desc: "Awarded to the top builder for excellence in quality and timely delivery.",
    image: `${IMG}/outdoors_reno.png`,
  },
  {
    id: "2019",
    year: "2019",
    title: "Sustainable Design Award",
    desc: "Honored for promoting sustainability and eco-friendly building practices.",
    image: `${IMG}/hero_worker.png`,
  },
  {
    id: "2018",
    year: "2018",
    title: "Excellence in Project Management",
    desc: "Recognized for outstanding project management and execution.",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "2017",
    year: "2017",
    title: "Emerging Developer of the Year",
    desc: "Awarded for exceptional growth and impact in the real estate industry.",
    image: `${IMG}/bathroom_reno.png`,
  },
];

export default function RealEstateAwardPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(
    data.pretitle || data.subtitle || "RECOGNITION OF EXCELLENCE",
  );
  const title = String(
    data.title || "Honoring Our Commitment to Quality & Innovation",
  );
  const description = String(
    data.description ||
      data.desc ||
      "Our awards reflect our dedication to superior craftsmanship, innovative design, and exceptional service in every project we deliver.",
  );

  const awards = (
    Array.isArray(data.awards) && data.awards.length
      ? data.awards
      : Array.isArray(data.awardItems) && data.awardItems.length
        ? data.awardItems
        : defaultAwards
  ) as AwardItem[];

  return (
    <section
      className="bg-white py-[30px] max-md:py-5"
      style={getAccentStyle(accent)}
      data-editor-section-label="awards"
      data-editor-fields="accentColor pretitle title description awards"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-6 text-center">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mx-auto mb-6 max-w-[800px] font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          {description ? (
            <p
              className="mx-auto max-w-[700px] text-[1.05rem] leading-relaxed text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 max-md:grid-cols-2 max-md:gap-3"
          data-box-layout-grid="grid"
        >
          {awards.map((award, index) => {
            const awardTitle = String(award.title || "Award");
            const awardDesc = String(award.desc || award.description || "");
            return (
              <article
                key={award.id || `${award.year}-${awardTitle}-${index}`}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-6 flex h-[280px] w-full items-center justify-center rounded bg-[#f9f9f9] p-6 max-md:mb-3 max-md:h-[140px] max-md:p-3">
                  <img
                    src={award.image || `${IMG}/hero_worker.png`}
                    alt={awardTitle}
                    className="max-h-full max-w-full object-contain"
                    data-editor-media="image"
                    data-editor-media-type="image"
                  />
                </div>
                {award.year ? (
                  <div
                    className="mb-2 text-[1.2rem] font-bold text-[var(--accent)]"
                    data-editor-field="year"
                  >
                    {award.year}
                  </div>
                ) : null}
                <div className="mb-3 h-0.5 w-8 bg-[var(--accent)]" />
                <h3
                  className="mb-3 text-[1.1rem] leading-snug font-bold text-[#111] max-md:mb-1.5 max-md:text-[0.95rem]"
                  data-editor-field="title"
                >
                  {awardTitle}
                </h3>
                {awardDesc ? (
                  <p
                    className="m-0 text-[0.9rem] leading-relaxed text-[#666] max-md:text-[0.75rem] max-md:leading-snug"
                    data-editor-field="desc"
                  >
                    {awardDesc}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
