"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type PerkItem = {
  id?: string;
  icon?: string;
  title?: string;
  description?: string;
  desc?: string;
};

const IMG = "/categories/realestate/template5";

const defaultFeatures: PerkItem[] = [
  {
    id: "culture",
    icon: "users",
    title: "Great Culture",
    description: "Work in a supportive and inclusive team.",
  },
  {
    id: "growth",
    icon: "growth",
    title: "Growth Opportunities",
    description: "Learn, grow, and build your future with us.",
  },
  {
    id: "reward",
    icon: "star",
    title: "Rewarding Work",
    description: "Be part of projects that create lasting value.",
  },
  {
    id: "balance",
    icon: "heart",
    title: "Work-Life Balance",
    description: "We value your time inside and outside work.",
  },
];

function PerkIcon({ type }: { type: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
  } as const;

  switch (type) {
    case "growth":
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "users":
    default:
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
  }
}

export default function RealEstateCareerPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(
    data.pretitle || data.tagline || "CAREERS AT PROPERTY",
  );
  const title = String(data.title || "Build Your Future With Us");
  const description = String(
    data.description ||
      data.desc ||
      "At Property, we believe our people are our greatest asset. We offer a collaborative environment, growth opportunities, and the chance to work on inspiring projects that make a real impact.",
  );
  const image = String(
    data.image || data.sideImage || `${IMG}/office_reno.png`,
  );
  const imageAlt = String(data.imageAlt || data.sideImageTitle || "Office Culture");
  const features = (
    Array.isArray(data.features) && data.features.length
      ? data.features
      : Array.isArray(data.perks) && data.perks.length
        ? data.perks
        : defaultFeatures
  ) as PerkItem[];

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="careerFeatures"
      data-editor-fields="accentColor pretitle title description image features"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center gap-8 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="flex-1">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mb-6 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mb-8 flex items-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          <p
            className="mb-6 text-[1.05rem] leading-[1.8] text-[#666]"
            data-editor-field="description"
          >
            {description}
          </p>
          <div
            className="grid grid-cols-2 gap-4 max-md:grid-cols-1 lg:grid-cols-4"
            data-box-layout-grid="grid"
          >
            {features.map((feature) => (
              <div
                key={feature.id || feature.title}
                className="text-center"
              >
                <div className="mb-4 inline-flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]">
                  <PerkIcon type={String(feature.icon || "users")} />
                </div>
                <div
                  className="mb-2 text-[0.9rem] font-semibold text-[#333]"
                  data-editor-field="title"
                >
                  {feature.title}
                </div>
                <div
                  className="text-[0.8rem] leading-normal text-[#666]"
                  data-editor-field="description"
                >
                  {feature.description || feature.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full flex-1">
          <div className="h-[400px] overflow-hidden rounded-lg max-md:h-[280px]">
            <img
              src={image}
              alt={imageAlt}
              className="h-full w-full object-cover"
              data-editor-media="image"
              data-editor-media-type="image"
              data-editor-field="image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
