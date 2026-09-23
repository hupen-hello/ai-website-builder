"use client";

import type { SectionProps } from "../../../types/section";
import { RealEstatePropertyCatalog } from "../buy-a-property/RealEstateProperty1";

export default function RealEstateRent1(props: SectionProps) {
  return <RealEstatePropertyCatalog {...props} mode="rent" />;
}
