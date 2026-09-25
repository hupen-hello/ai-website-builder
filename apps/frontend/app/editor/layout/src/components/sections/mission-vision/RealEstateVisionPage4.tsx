"use client";

import type { SectionProps } from "../../../types/section";
import VisionOverview from "./RealEstateVision4";

export default function RealEstateVisionPage4({
  data: engineData = {},
}: SectionProps) {
  return <VisionOverview data={engineData} />;
}
