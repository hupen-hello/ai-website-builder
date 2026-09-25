"use client";

import type { ElementType } from "react";
import {
  Award,
  BadgeDollarSign,
  Heart,
  Scale,
  TrendingUp,
} from "lucide-react";
import { careerPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  CareerFeature4Item,
  CareerPage4Data,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  TrendingUp,
  Heart,
  Award,
  BadgeDollarSign,
  Scale,
};

const defaultFeatures: CareerFeature4Item[] = [
  {
    id: "growth",
    icon: "TrendingUp",
    title: "Growth & Development",
    description:
      "We invest in your growth with training, mentorship and career advancement.",
  },
  {
    id: "culture",
    icon: "Heart",
    title: "Great Work Culture",
    description:
      "Collaborative, inclusive and supportive environment where you belong.",
  },
  {
    id: "recognition",
    icon: "Award",
    title: "Recognition",
    description:
      "We appreciate your contributions and celebrate your achievements.",
  },
  {
    id: "benefits",
    icon: "BadgeDollarSign",
    title: "Competitive Benefits",
    description:
      "Attractive compensation packages with health, wellness and financial benefits.",
  },
  {
    id: "balance",
    icon: "Scale",
    title: "Work-Life Balance",
    description:
      "We value your time and support flexibility for a balanced lifestyle.",
  },
];

export default function RealEstateCareerPage4({ data = {} }: SectionProps) {
  const authored = careerPage4Content.RealEstateCareerPage4;
  const content: CareerPage4Data = {
    ...authored,
    ...(data as CareerPage4Data),
  };
  const features = content.features?.length
    ? content.features
    : (authored.features ?? defaultFeatures);

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="careerFeatures"
      data-editor-fields="accentColor pretitle title description features"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]/30" />
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]/60" />
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            </div>
            <h3
              className="text-sm font-bold tracking-widest text-[var(--accent)] uppercase"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "WHY WORK WITH US"}
            </h3>
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]/60" />
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]/30" />
            </div>
          </div>
          <h2
            className="mb-6 text-3xl font-bold text-secondary md:text-4xl"
            data-editor-field="title"
          >
            {content.title ?? "More Than Just A Workplace"}
          </h2>
          <p
            className="text-[15px] text-gray-600"
            data-editor-field="description"
          >
            {content.description ??
              "We believe in empowering our people, inspiring growth and creating a positive impact together."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-3 lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-gray-200">
          {features.map((feature) => {
            const Icon =
              (feature.icon ? iconMap[feature.icon] : null) || TrendingUp;

            return (
              <div
                key={feature.id ?? feature.title}
                className="flex flex-col items-center px-4 text-center"
              >
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 text-[var(--accent)] shadow-sm">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--accent)] opacity-20" />
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h4
                  className="mb-3 text-[15px] font-bold text-secondary"
                  data-editor-field="title"
                >
                  {feature.title}
                </h4>
                <p
                  className="text-[13px] leading-relaxed text-gray-500"
                  data-editor-field="description"
                >
                  {feature.description ?? feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
