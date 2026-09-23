"use client";

import type { SectionProps } from "../../../types/section";
import RealEstateCSRImpact1 from "./RealEstateCSRImpact1";

type ImpactStat = { stat: string; label: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getImpactStats = (value: unknown): ImpactStat[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.stat === "string" &&
        typeof item.label === "string"
          ? [{ stat: item.stat, label: item.label }]
          : [],
      )
    : [];

export default function RealEstateCSRPage1({ data = {} }: SectionProps) {
  const impactStats = getImpactStats(data.impactStats);
  const sideImage =
    typeof data.sideImage === "string" ? data.sideImage : undefined;

  return (
    <RealEstateCSRImpact1
      image={sideImage}
      imageAlt={
        typeof data.sideImageTitle === "string"
          ? data.sideImageTitle
          : "HAUS Group community initiative"
      }
      stats={impactStats}
    />
  );
}
