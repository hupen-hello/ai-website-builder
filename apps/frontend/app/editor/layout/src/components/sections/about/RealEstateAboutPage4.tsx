"use client";

import type { SectionProps } from "../../../types/section";
import AboutIntro from "./RealEstateAbout4";

export default function RealEstateAboutPage4({
  data: engineData = {},
}: SectionProps) {
  return <AboutIntro data={engineData} />;
}
