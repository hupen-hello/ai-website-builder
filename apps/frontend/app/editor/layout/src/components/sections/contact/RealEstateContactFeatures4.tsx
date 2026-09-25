"use client";

import type { ElementType } from "react";
import {
  Headphones,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { contactPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  ContactFeature4Item,
  ContactFeatures4Data,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Headphones,
  ShieldCheck,
  Users,
  MessageSquare,
};

const defaultFeatures: ContactFeature4Item[] = [
  {
    id: "support",
    icon: "Headphones",
    title: "Quick Support",
    description: "We reply to all inquiries within 24 hours.",
  },
  {
    id: "trusted",
    icon: "ShieldCheck",
    title: "Trusted Service",
    description: "Your satisfaction and trust are our top priority.",
  },
  {
    id: "team",
    icon: "Users",
    title: "Expert Team",
    description: "Our experts are always ready to assist you.",
  },
  {
    id: "channels",
    icon: "MessageSquare",
    title: "Multiple Channels",
    description: "Reach us via phone, email or visit our office.",
  },
];

export default function RealEstateContactFeatures4({
  data = {},
}: SectionProps) {
  const authored = contactPage4Content.RealEstateContactFeatures4;
  const content: ContactFeatures4Data = {
    ...authored,
    ...(data as ContactFeatures4Data),
  };
  const features = content.features?.length
    ? content.features
    : (authored.features ?? defaultFeatures);

  return (
    <section
      className="bg-gray-50 pb-16"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="contactFeatures"
      data-editor-fields="accentColor features"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-y-6 rounded-xl border border-gray-100 bg-white p-8 shadow-sm md:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-gray-100">
          {features.map((feature) => {
            const Icon =
              (feature.icon ? iconMap[feature.icon] : null) || Headphones;

            return (
              <div
                key={feature.id ?? feature.title}
                className="flex items-center gap-4 lg:px-6 first:lg:pl-0 last:lg:pr-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-100 text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4
                    className="mb-1 text-[14px] font-bold text-secondary"
                    data-editor-field="title"
                  >
                    {feature.title}
                  </h4>
                  <p
                    className="text-[12px] text-gray-500"
                    data-editor-field="description"
                  >
                    {feature.description ?? feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
