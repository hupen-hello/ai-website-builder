"use client";

import type { SectionProps } from "../../../types/section";
import RealEstateAbout1 from "./RealEstateAbout1";

const defaultPromises = [
  "Verified property information",
  "Clear pricing and local context",
  "Guided visits with local advisors",
  "Support from shortlist to closing",
];

const readPromises = (value: unknown): string[] => {
  if (!Array.isArray(value)) return defaultPromises;
  const items = value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item];
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { title?: unknown }).title === "string" &&
      (item as { title: string }).title.trim()
    ) {
      return [(item as { title: string }).title];
    }
    return [];
  });
  return items.length ? items : defaultPromises;
};

export default function RealEstateAboutPage1({ data = {} }: SectionProps) {
  const promises = readPromises(data.promises);

  return (
    <div className="bg-white text-[#141414]">
      <RealEstateAbout1 data={data} pageMode promises={promises} />
    </div>
  );
}
