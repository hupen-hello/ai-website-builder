"use client";

import type { SectionProps } from "../../../types/section";
import RealEstateAbout5 from "./RealEstateAbout5";

export default function RealEstateAboutPage5({
  data: engineData = {},
}: SectionProps) {
  return <RealEstateAbout5 data={engineData} />;
}
