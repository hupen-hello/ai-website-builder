"use client";

import type { SectionProps } from "../../../types/section";
import { RealEstateLegalPageLayout } from "../privacy-policy/RealEstatePrivacyPolicy1";

export default function RealEstateDisclaimer1({ data = {} }: SectionProps) {
  return (
    <RealEstateLegalPageLayout
      data={data}
      sectionIdPrefix="disclaimer"
      contactTitle="Need clarification?"
      contactDescription="Contact a HAUS Group advisor to verify listing details, availability, pricing, documentation, or any information shown on this website."
    />
  );
}
