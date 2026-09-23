"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import {
  FaHandshake,
  FaLocationDot,
  FaShieldHalved,
  FaStopwatch,
} from "react-icons/fa6";
import type { SectionProps } from "../../../types/section";

type Feature = {
  title: string;
  desc: string;
  icon?: string;
  image?: string;
};

const featureIcons: Record<string, ComponentType<{ className?: string }>> = {
  location: FaLocationDot,
  verified: FaShieldHalved,
  support: FaHandshake,
  delivery: FaStopwatch,
};

const getFeatures = (value: unknown): Feature[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const feature = item as Record<string, unknown>;
    if (typeof feature.title !== "string") return [];

    return [{
      title: feature.title,
      desc: typeof feature.desc === "string" ? feature.desc : "",
      icon: typeof feature.icon === "string" ? feature.icon : undefined,
      image: typeof feature.image === "string" ? feature.image : undefined,
    }];
  });
};

export default function RealEstateFeatures1({ data = {} }: SectionProps) {
  const features = getFeatures(data.features).slice(0, 4);

  if (!features.length) return null;

  return (
    <section className="border-y border-white/10 bg-linear-to-r from-[#02090a] via-[#0c1111] to-[#1b1b1b] text-white">
      <div data-box-layout-grid="grid" className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-7 sm:grid-cols-2 sm:px-8 md:grid-cols-4 md:gap-7 md:px-12 md:py-8 lg:px-10">
        {features.map((item) => {
          const Icon = featureIcons[item.icon || ""] || FaLocationDot;

          return (
            <article key={item.title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 text-white">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon className="text-sm" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                {item.desc && <p className="mt-1 text-xs leading-snug text-white/65">{item.desc}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
